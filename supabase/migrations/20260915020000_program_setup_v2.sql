-- Program setup v2: profiles are layered the OSCAL way (a tailored profile imports its base profile
-- and records what it tailors out and in), the wizard authors one program profile per chosen base and
-- every system adopts one explicitly, components pulled from the library become elements of the tree,
-- and a system that tailors further post-create layers on the program profile instead of re-listing.
-- See docs/program-wizard.md.

-- ---------------------------------------------------------------------------------------------
-- A layered resolution remembers the exact base resolution it was resolved against.
-- ---------------------------------------------------------------------------------------------
alter table public.profile_resolutions
  add column base_profile_resolution_id uuid references public.profile_resolutions(id),
  add constraint profile_resolutions_base_not_self check (base_profile_resolution_id is distinct from id);
select public.attach_reference_tenant_guard('profile_resolutions','base_profile_resolution_id','profile_resolutions');
comment on column public.profile_resolutions.base_profile_resolution_id is 'For a layered profile: the exact base resolution its first import was resolved against. NULL for a profile that imports a catalog directly.';

-- Every reader gets the catalog and the chain of a resolution from one row instead of walking imports.
create view public.profile_resolution_catalogs with (security_invoker=true) as
with recursive chain as (
  select r.id,r.tenant_id,r.profile_revision_id,r.id as cursor_id,r.base_profile_resolution_id as next_id,0 as depth,
    (select i.catalog_revision_id from public.profile_imports i where i.profile_revision_id=r.profile_revision_id and i.catalog_revision_id is not null
       and not exists(select 1 from public.profile_imports j where j.profile_revision_id=r.profile_revision_id and j.id<>i.id) limit 1) as catalog_revision_id
  from public.profile_resolutions r
  union all
  select c.id,c.tenant_id,c.profile_revision_id,b.id,b.base_profile_resolution_id,c.depth+1,
    (select i.catalog_revision_id from public.profile_imports i where i.profile_revision_id=b.profile_revision_id and i.catalog_revision_id is not null
       and not exists(select 1 from public.profile_imports j where j.profile_revision_id=b.profile_revision_id and j.id<>i.id) limit 1)
  from chain c join public.profile_resolutions b on b.id=c.next_id where c.catalog_revision_id is null and c.depth<3
)
select c.id,c.tenant_id,c.id as profile_resolution_id,c.profile_revision_id,c.catalog_revision_id,
  r.base_profile_resolution_id,c.cursor_id as root_profile_resolution_id,c.depth,c.depth>0 as layered
from chain c join public.profile_resolutions r on r.id=c.id where c.catalog_revision_id is not null;
grant select on public.profile_resolution_catalogs to authenticated;
revoke all on public.profile_resolution_catalogs from public,anon;
comment on view public.profile_resolution_catalogs is 'The catalog a resolution ultimately selects from, the root reference resolution and the depth of layering, for every resolution whose import chain ends at one catalog.';

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
      or (c.relkind='v' and c.relname in ('composition_nodes','system_component_element_links','system_effective_baselines','profile_resolution_catalogs')))
      and c.relname not in ('workspace_snapshots','spatial_ref_sys','tenants','tenant_memberships')
      and pg_catalog.has_table_privilege('authenticated',c.oid,'SELECT')
      and exists(select 1 from pg_catalog.pg_attribute a where a.attrelid=c.oid and a.attname='id' and not a.attisdropped)
  ) tables;
  return result;
end; $$;
revoke all on function public.app_schema() from public,anon;
grant execute on function public.app_schema() to authenticated;

-- ---------------------------------------------------------------------------------------------
-- The element type a library component becomes when it is pulled into the tree.
-- ---------------------------------------------------------------------------------------------
create function public.element_type_for_component(component_type text) returns text
language sql immutable set search_path='' as $$
  select case component_type when 'hardware' then 'hardware' when 'software' then 'software' when 'service' then 'service' when 'interconnection' then 'network' else 'other' end;
$$;
revoke all on function public.element_type_for_component(text) from public,anon,authenticated;

-- ---------------------------------------------------------------------------------------------
-- Resolve a base: a reference profile importing its catalog directly (today's rules) or a layered
-- profile whose first import is a published profile with a published resolution. The selection is
-- re-derived from the original OSCAL and checked against the stored one, at most three layers deep.
-- ---------------------------------------------------------------------------------------------
create function public.resolve_base_controls(p_tenant_id uuid,p_catalog_id uuid,p_resolution_id uuid,p_depth integer default 0)
returns uuid[] language plpgsql security definer set search_path='' as $$
declare
  v_resolution public.profile_resolutions; v_profile public.profile_revisions; v_document public.oscal_document_revisions;
  v_catalog public.catalog_revisions; v_base public.profile_resolutions; v_base_profile public.profile_revisions;
  v_body jsonb; v_import0 jsonb; v_import1 jsonb; v_directive jsonb; v_source jsonb; v_control uuid;
  v_base_ids uuid[]; v_excluded uuid[]:='{}'; v_included uuid[]:='{}'; v_resolved uuid[]; v_recorded uuid[];
  v_import_count integer; v_rule record; v_expected jsonb; v_settings jsonb; v_prop_count integer;
  v_setting public.profile_parameter_settings; v_parameter public.parameters; v_values jsonb;
begin
  if p_depth>3 then raise exception 'Profile layering deeper than three levels is not supported' using errcode='23514'; end if;
  select * into v_resolution from public.profile_resolutions where id=p_resolution_id and (tenant_id is null or tenant_id=p_tenant_id) and state='published' for share;
  if v_resolution.id is null then raise exception 'Choose a published, resolved profile available to this workspace' using errcode='23514'; end if;
  if v_resolution.base_profile_resolution_id is null then
    return public.wizard_base_controls(p_tenant_id,p_catalog_id,p_resolution_id);
  end if;
  select * into v_profile from public.profile_revisions where id=v_resolution.profile_revision_id and (tenant_id is null or tenant_id=p_tenant_id) and state='published' for share;
  select * into v_document from public.oscal_document_revisions where id=v_profile.document_revision_id and (tenant_id is null or tenant_id=p_tenant_id) and state='published' for share;
  select * into v_catalog from public.catalog_revisions where id=p_catalog_id and (tenant_id is null or tenant_id=p_tenant_id) and state='published' for share;
  if v_profile.id is null or v_document.id is null or v_catalog.id is null then raise exception 'Choose a published catalog and a published, resolved profile available to this workspace' using errcode='23514'; end if;
  if not exists(select 1 from public.profile_resolution_inputs where profile_resolution_id=p_resolution_id and document_revision_id=v_catalog.document_revision_id)
    or not exists(select 1 from public.profile_resolution_inputs where profile_resolution_id=p_resolution_id and document_revision_id=v_document.id)
    or exists(select 1 from public.profile_resolution_inputs i join public.oscal_document_revisions d on d.id=i.document_revision_id where i.profile_resolution_id=p_resolution_id and (d.state<>'published' or (d.tenant_id is not null and d.tenant_id<>p_tenant_id))) then
    raise exception 'The layered resolution must pin its published document, base profile and catalog inputs' using errcode='23514';
  end if;
  select * into v_base from public.profile_resolutions where id=v_resolution.base_profile_resolution_id and (tenant_id is null or tenant_id=p_tenant_id) and state='published';
  select * into v_base_profile from public.profile_revisions where id=v_base.profile_revision_id and state='published';
  if v_base.id is null or v_base_profile.id is null then raise exception 'The base resolution of a layered profile must be published' using errcode='23514'; end if;
  if exists(select 1 from public.profile_resolution_inputs b where b.profile_resolution_id=v_base.id and not exists(select 1 from public.profile_resolution_inputs i where i.profile_resolution_id=p_resolution_id and i.document_revision_id=b.document_revision_id)) then
    raise exception 'A layered resolution must pin every input of its base' using errcode='23514';
  end if;
  v_body:=v_document.original_content->'profile';
  if jsonb_typeof(v_body->'imports') is distinct from 'array' or jsonb_array_length(v_body->'imports') not between 1 and 2
    or v_body->'merge' is distinct from '{"as-is":true}'::jsonb
    or (v_body ? 'modify' and (jsonb_typeof(v_body->'modify')<>'object' or ((v_body->'modify')-'set-parameters')<>'{}'::jsonb)) then
    raise exception 'This layered profile uses unsupported imports, merge, or modification directives' using errcode='23514';
  end if;
  select count(*) into v_prop_count from jsonb_array_elements(coalesce(v_body->'metadata'->'props','[]'::jsonb)) p where p->>'name'='base-resolution-id' and p->>'ns'='urn:program-assurance:profile-authoring';
  if v_prop_count<>1 or not exists(select 1 from jsonb_array_elements(v_body->'metadata'->'props') p where p->>'name'='base-resolution-id' and p->>'value'=v_base.id::text) then
    raise exception 'The layered profile does not record its base resolution' using errcode='23514';
  end if;
  v_import0:=v_body->'imports'->0; v_import1:=v_body->'imports'->1;
  if jsonb_typeof(v_import0)<>'object' or (v_import0-'href'-'include-all'-'exclude-controls')<>'{}'::jsonb or v_import0->'include-all' is distinct from '{}'::jsonb then
    raise exception 'The layered profile must import its base profile with include-all' using errcode='23514';
  end if;
  if v_import1 is not null and (jsonb_typeof(v_import1)<>'object' or (v_import1-'href'-'include-controls')<>'{}'::jsonb or jsonb_typeof(v_import1->'include-controls') is distinct from 'array' or jsonb_array_length(v_import1->'include-controls')=0) then
    raise exception 'The layered profile may add controls only through one explicit catalog import' using errcode='23514';
  end if;
  select count(*) into v_import_count from public.profile_imports where profile_revision_id=v_profile.id;
  if v_import_count<>jsonb_array_length(v_body->'imports')
    or not exists(select 1 from public.profile_imports where profile_revision_id=v_profile.id and ordinal=0 and imported_profile_revision_id=v_base_profile.id and catalog_revision_id is null and include_all)
    or (v_import1 is not null and not exists(select 1 from public.profile_imports where profile_revision_id=v_profile.id and ordinal=1 and catalog_revision_id=p_catalog_id and imported_profile_revision_id is null and not include_all)) then
    raise exception 'The normalized layered imports do not match the profile source' using errcode='23514';
  end if;
  if not exists(select 1 from public.oscal_document_imports where document_revision_id=v_document.id and ordinal=0 and referenced_revision_id=v_base_profile.document_revision_id) then
    raise exception 'The layered profile does not pin its base profile document' using errcode='23514';
  end if;
  v_base_ids:=public.resolve_base_controls(p_tenant_id,p_catalog_id,v_base.id,p_depth+1);
  if v_import0 ? 'exclude-controls' then
    if jsonb_typeof(v_import0->'exclude-controls')<>'array' then raise exception 'Invalid exclusion directives' using errcode='23514'; end if;
    for v_directive in select value from jsonb_array_elements(v_import0->'exclude-controls') loop
      if jsonb_typeof(v_directive->'with-ids') is distinct from 'array' or jsonb_array_length(v_directive->'with-ids')=0 or (v_directive-'with-ids'-'with-child-controls')<>'{}'::jsonb or coalesce(v_directive->>'with-child-controls','no')<>'no' then raise exception 'Unsupported exclusion directives' using errcode='23514'; end if;
      for v_source in select value from jsonb_array_elements(v_directive->'with-ids') loop
        select id into v_control from public.controls c where c.catalog_revision_id=p_catalog_id and c.source_id=(v_source#>>'{}');
        if jsonb_typeof(v_source)<>'string' or v_control is null or not v_control=any(v_base_ids) then raise exception 'Excluded controls must be selected by the base profile' using errcode='23514'; end if;
        v_excluded:=array_append(v_excluded,v_control);
      end loop;
    end loop;
  end if;
  if v_import1 is not null then
    for v_directive in select value from jsonb_array_elements(v_import1->'include-controls') loop
      if jsonb_typeof(v_directive->'with-ids') is distinct from 'array' or jsonb_array_length(v_directive->'with-ids')=0 or (v_directive-'with-ids'-'with-child-controls')<>'{}'::jsonb or coalesce(v_directive->>'with-child-controls','no')<>'no' then raise exception 'Matching and child expansion are not supported' using errcode='23514'; end if;
      for v_source in select value from jsonb_array_elements(v_directive->'with-ids') loop
        select id into v_control from public.controls c where c.catalog_revision_id=p_catalog_id and c.source_id=(v_source#>>'{}');
        if jsonb_typeof(v_source)<>'string' or v_control is null or v_control=any(v_base_ids) or v_control=any(v_included) then raise exception 'Included controls must be catalog controls outside the base profile' using errcode='23514'; end if;
        v_included:=array_append(v_included,v_control);
      end loop;
    end loop;
  end if;
  select coalesce(array_agg(distinct id order by id),'{}') into v_resolved from unnest(v_base_ids||v_included) id where not id=any(v_excluded);
  select coalesce(array_agg(control_id order by control_id),'{}') into v_recorded from public.selected_controls where profile_resolution_id=p_resolution_id;
  if cardinality(v_resolved)=0 or v_resolved is distinct from v_recorded then raise exception 'The stored layered resolution does not match its OSCAL selection' using errcode='23514'; end if;
  v_settings:=coalesce(v_body->'modify'->'set-parameters','[]'::jsonb);
  if jsonb_typeof(v_settings)<>'array' then raise exception 'Unsupported parameter modification' using errcode='23514'; end if;
  if (select count(*) from public.profile_rules where profile_revision_id=v_profile.id)
    <> coalesce(jsonb_array_length(v_import0->'exclude-controls'),0)+coalesce(jsonb_array_length(v_import1->'include-controls'),0)+jsonb_array_length(v_settings)+1 then
    raise exception 'The normalized layered profile rules do not match the source document' using errcode='23514';
  end if;
  for v_rule in select r.kind,r.ordinal,r.definition,i.ordinal as import_ordinal from public.profile_rules r left join public.profile_imports i on i.id=r.profile_import_id where r.profile_revision_id=v_profile.id loop
    v_expected:=case v_rule.kind
      when 'exclude' then case when v_rule.import_ordinal=0 then v_import0->'exclude-controls'->v_rule.ordinal end
      when 'include' then case when v_rule.import_ordinal=1 then v_import1->'include-controls'->v_rule.ordinal end
      when 'merge' then v_body->'merge'
      when 'set-parameter' then v_settings->v_rule.ordinal
      else null end;
    if v_expected is null or v_expected is distinct from v_rule.definition then raise exception 'Unsupported or inconsistent normalized profile rule' using errcode='23514'; end if;
  end loop;
  if (select count(*) from public.profile_parameter_settings where profile_revision_id=v_profile.id)<>jsonb_array_length(v_settings) then raise exception 'The profile is missing normalized parameter values' using errcode='23514'; end if;
  for v_directive in select value from jsonb_array_elements(v_settings) loop
    if (v_directive-'param-id'-'values')<>'{}'::jsonb or jsonb_typeof(v_directive->'values') is distinct from 'array' or jsonb_array_length(v_directive->'values')=0 then raise exception 'Only explicit parameter value assignments are supported' using errcode='23514'; end if;
    select * into v_parameter from public.parameters where catalog_revision_id=p_catalog_id and source_id=v_directive->>'param-id';
    select * into v_setting from public.profile_parameter_settings where profile_revision_id=v_profile.id and parameter_source_id=v_directive->>'param-id';
    select jsonb_agg(value order by ordinal) into v_values from public.profile_parameter_values where setting_id=v_setting.id;
    if v_parameter.id is null or v_parameter.control_id is null or not v_parameter.control_id=any(v_resolved)
      or v_setting.parameter_id is distinct from v_parameter.id or v_setting.label is not null or v_setting.usage is not null
      or v_values is distinct from v_directive->'values' then raise exception 'Layered parameter settings must assign values to selected controls and match the source document' using errcode='23514'; end if;
  end loop;
  return v_resolved;
end; $$;
revoke all on function public.resolve_base_controls(uuid,uuid,uuid,integer) from public,anon,authenticated;
comment on function public.resolve_base_controls(uuid,uuid,uuid,integer) is 'Derive a base selection from original OSCAL: a direct catalog profile through wizard_base_controls, or a layered profile as base minus exclusions plus explicit additions, checked against the stored selection.';

-- ---------------------------------------------------------------------------------------------
-- Author a tailored profile on top of a base and publish it: import 0 is the base profile with
-- include-all and the tailored-out controls excluded; import 1 (only when needed) is the catalog with
-- the tailored-in controls; this layer's parameter overrides go under modify. Inherited settings arrive
-- through the import, which is what OSCAL resolution means. Returns the published resolution.
-- ---------------------------------------------------------------------------------------------
create function public.author_tailored_profile(p_tenant_id uuid,p_catalog_id uuid,p_base_resolution_id uuid,p_decisions jsonb,p_parameters jsonb,p_code text,p_title text,p_remarks text)
returns uuid language plpgsql security definer set search_path='' as $$
declare
  v_base_ids uuid[]; v_included uuid[]:='{}'; v_excluded uuid[]:='{}'; v_selected uuid[]; v_seen uuid[]:='{}';
  v_catalog public.catalog_revisions; v_catalog_doc public.oscal_document_revisions;
  v_base public.profile_resolutions; v_base_profile public.profile_revisions; v_base_doc public.oscal_document_revisions;
  v_decision jsonb; v_control public.controls; v_parameter public.parameters; v_item jsonb; v_value jsonb; v_values jsonb;
  v_effective jsonb:='{}'; v_chain uuid[]:='{}'; v_cursor uuid; v_layer_profile uuid; v_setting record; v_entry record; v_input record;
  v_document_id uuid:=gen_random_uuid(); v_document_revision_id uuid:=gen_random_uuid(); v_profile_id uuid:=gen_random_uuid();
  v_profile_revision_id uuid:=gen_random_uuid(); v_resolution_id uuid:=gen_random_uuid();
  v_base_resource uuid:=gen_random_uuid(); v_catalog_resource uuid:=gen_random_uuid();
  v_include_sources jsonb; v_exclude_sources jsonb; v_selected_sources jsonb; v_rationale_props jsonb; v_metadata jsonb; v_body jsonb; v_document jsonb; v_document_sha text;
  v_normalized jsonb; v_output jsonb; v_import0 uuid; v_import1 uuid; v_doc_import uuid; v_include_rules jsonb:='{}'; v_include_directives jsonb; v_rule_id uuid; v_selected_id uuid; v_setting_id uuid;
  v_ordinal integer; v_now timestamptz:=now();
begin
  if p_code is null or btrim(p_code)='' or p_title is null or btrim(p_title)='' then raise exception 'A tailored profile needs a code and a title' using errcode='23514'; end if;
  if jsonb_typeof(p_decisions) is distinct from 'array' or jsonb_typeof(p_parameters) is distinct from 'array' then raise exception 'Invalid tailoring details' using errcode='23514'; end if;
  if jsonb_array_length(p_decisions)=0 and jsonb_array_length(p_parameters)=0 then raise exception 'Nothing to tailor; adopt the base resolution directly' using errcode='23514'; end if;
  v_base_ids:=public.resolve_base_controls(p_tenant_id,p_catalog_id,p_base_resolution_id,0);
  select * into v_catalog from public.catalog_revisions where id=p_catalog_id;
  select * into v_catalog_doc from public.oscal_document_revisions where id=v_catalog.document_revision_id;
  select * into v_base from public.profile_resolutions where id=p_base_resolution_id;
  select * into v_base_profile from public.profile_revisions where id=v_base.profile_revision_id;
  select * into v_base_doc from public.oscal_document_revisions where id=v_base_profile.document_revision_id;
  for v_decision in select value from jsonb_array_elements(p_decisions) loop
    select * into v_control from public.controls where id=(v_decision->>'controlId')::uuid and catalog_revision_id=p_catalog_id;
    if v_control.id is null then raise exception 'Tailoring must select actual controls from the chosen catalog' using errcode='23514'; end if;
    if v_control.id=any(v_seen) then raise exception 'Record one tailoring decision per control' using errcode='23514'; end if;
    v_seen:=array_append(v_seen,v_control.id);
    perform public.wizard_required_text(v_decision,'rationale');
    if v_decision->>'action'='include' then
      if v_control.status<>'active' then raise exception 'Withdrawn controls cannot be newly included' using errcode='23514'; end if;
      if v_control.id=any(v_base_ids) then raise exception 'An included control is already selected by the base profile' using errcode='23514'; end if;
      v_included:=array_append(v_included,v_control.id);
    elsif v_decision->>'action'='exclude' then
      if not v_control.id=any(v_base_ids) then raise exception 'Exclude only controls selected by the base profile' using errcode='23514'; end if;
      v_excluded:=array_append(v_excluded,v_control.id);
    else raise exception 'Choose include or exclude for tailoring' using errcode='23514'; end if;
  end loop;
  select coalesce(array_agg(id order by public.wizard_control_order(source_id),id),'{}') into v_selected from public.controls where (id=any(v_base_ids) or id=any(v_included)) and not id=any(v_excluded);
  if cardinality(v_selected)=0 then raise exception 'A tailored baseline must retain at least one control' using errcode='23514'; end if;
  -- Effective parameters: catalog defaults, then every layer's settings root-first, then this layer's overrides.
  for v_parameter in select * from public.parameters where catalog_revision_id=p_catalog_id and control_id=any(v_selected) loop
    select jsonb_agg(value order by ordinal) into v_values from public.parameter_values where parameter_id=v_parameter.id;
    if v_values is not null then v_effective:=v_effective||jsonb_build_object(v_parameter.id::text,jsonb_build_object('values',v_values,'rationale',null,'origin','catalog')); end if;
  end loop;
  v_cursor:=p_base_resolution_id;
  while v_cursor is not null loop
    v_chain:=array_prepend(v_cursor,v_chain);
    if cardinality(v_chain)>3 then raise exception 'Profile layering deeper than three levels is not supported' using errcode='23514'; end if;
    select base_profile_resolution_id into v_cursor from public.profile_resolutions where id=v_cursor;
  end loop;
  foreach v_cursor in array v_chain loop
    select profile_revision_id into v_layer_profile from public.profile_resolutions where id=v_cursor;
    for v_setting in select s.id,s.rationale,p.id as catalog_parameter_id from public.profile_parameter_settings s join public.parameters p on p.catalog_revision_id=p_catalog_id and p.source_id=s.parameter_source_id where s.profile_revision_id=v_layer_profile and p.control_id=any(v_selected) loop
      select jsonb_agg(value order by ordinal) into v_values from public.profile_parameter_values where setting_id=v_setting.id;
      if v_values is not null then v_effective:=v_effective||jsonb_build_object(v_setting.catalog_parameter_id::text,jsonb_build_object('values',v_values,'rationale',v_setting.rationale,'origin','profile')); end if;
    end loop;
  end loop;
  v_seen:='{}';
  for v_item in select value from jsonb_array_elements(p_parameters) loop
    select * into v_parameter from public.parameters where id=(v_item->>'parameterId')::uuid and catalog_revision_id=p_catalog_id and control_id=any(v_selected);
    if v_parameter.id is null then raise exception 'Set parameters only for selected controls in this catalog' using errcode='23514'; end if;
    if v_parameter.id=any(v_seen) then raise exception 'Record one value set per parameter' using errcode='23514'; end if;
    v_seen:=array_append(v_seen,v_parameter.id);
    perform public.wizard_required_text(v_item,'rationale');
    if jsonb_typeof(v_item->'values') is distinct from 'array' or jsonb_array_length(v_item->'values') not between 1 and 100 then raise exception 'Enter at least one parameter value' using errcode='23514'; end if;
    if exists(select 1 from jsonb_array_elements(v_item->'values') v where jsonb_typeof(v)<>'string') then raise exception 'Parameter values must be text' using errcode='23514'; end if;
    select jsonb_agg(btrim(v.value#>>'{}') order by v.ordinality) into v_values from jsonb_array_elements(v_item->'values') with ordinality v(value,ordinality);
    for v_value in select value from jsonb_array_elements(v_values) loop
      if length(v_value#>>'{}')=0 or length(v_value#>>'{}')>10000 then raise exception 'Parameter values cannot be empty' using errcode='23514'; end if;
      if v_parameter.has_selection and exists(select 1 from public.parameter_choices where parameter_id=v_parameter.id) and not exists(select 1 from public.parameter_choices where parameter_id=v_parameter.id and value ~ '(\{\{|<[^>]+>)')
        and not exists(select 1 from public.parameter_choices where parameter_id=v_parameter.id and value=v_value#>>'{}') then raise exception 'Choose a published option for this selection parameter' using errcode='23514'; end if;
    end loop;
    if coalesce(v_parameter.selection_count,'one')='one' and v_parameter.has_selection and jsonb_array_length(v_values)<>1 then raise exception 'This parameter requires exactly one selected value' using errcode='23514'; end if;
    v_effective:=v_effective||jsonb_build_object(v_parameter.id::text,jsonb_build_object('values',v_values,'rationale',btrim(v_item->>'rationale'),'origin','override'));
  end loop;
  for v_entry in select e.key,e.value from jsonb_each(v_effective) e loop
    select * into v_parameter from public.parameters where id=v_entry.key::uuid;
    if v_parameter.has_selection and coalesce(v_parameter.selection_count,'one')='one' and jsonb_array_length(v_entry.value->'values')<>1 then raise exception 'An inherited selection parameter requires exactly one value' using errcode='23514'; end if;
    if v_parameter.has_selection and exists(select 1 from public.parameter_choices where parameter_id=v_parameter.id) and not exists(select 1 from public.parameter_choices where parameter_id=v_parameter.id and value ~ '(\{\{|<[^>]+>)')
      and exists(select 1 from jsonb_array_elements_text(v_entry.value->'values') v where not exists(select 1 from public.parameter_choices c where c.parameter_id=v_parameter.id and c.value=v.value)) then raise exception 'An inherited parameter value does not match a published selection option' using errcode='23514'; end if;
  end loop;
  -- The document.
  select jsonb_agg(source_id order by public.wizard_control_order(source_id),id) into v_include_sources from public.controls where id=any(v_included);
  select jsonb_agg(jsonb_build_object('with-child-controls','no','with-ids',jsonb_build_array(source_id)) order by public.wizard_control_order(source_id),id) into v_include_directives from public.controls where id=any(v_included);
  select jsonb_agg(source_id order by public.wizard_control_order(source_id),id) into v_selected_sources from public.controls where id=any(v_selected);
  select coalesce(jsonb_agg(jsonb_build_object('with-child-controls','no','with-ids',jsonb_build_array(c.source_id)) order by item.ordinality),'[]') into v_exclude_sources
    from jsonb_array_elements(p_decisions) with ordinality item(value,ordinality) join public.controls c on c.id=(item.value->>'controlId')::uuid where item.value->>'action'='exclude';
  select coalesce(jsonb_agg(jsonb_build_object('name','control-'||(item.value->>'action')||'-rationale','ns','urn:program-assurance:profile-authoring','class',c.source_id,'value',btrim(item.value->>'rationale')) order by item.ordinality),'[]') into v_rationale_props
    from jsonb_array_elements(p_decisions) with ordinality item(value,ordinality) join public.controls c on c.id=(item.value->>'controlId')::uuid;
  select v_rationale_props||coalesce(jsonb_agg(jsonb_build_object('name','parameter-rationale','ns','urn:program-assurance:profile-authoring','class',p.source_id,'value',e.value->>'rationale') order by public.wizard_control_order(p.source_id)),'[]') into v_rationale_props
    from jsonb_each(v_effective) e join public.parameters p on p.id=e.key::uuid where e.value->>'origin'='override' and nullif(e.value->>'rationale','') is not null;
  v_metadata:=jsonb_build_object('title',p_title,'last-modified',to_char(v_now at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'version','1','oscal-version',v_catalog_doc.oscal_version,
    'links',jsonb_build_array(jsonb_build_object('href','#'||v_base_resource::text,'rel','derived-from')),
    'props',jsonb_build_array(jsonb_build_object('name','base-resolution-id','ns','urn:program-assurance:profile-authoring','value',p_base_resolution_id))||v_rationale_props);
  if p_remarks is not null and btrim(p_remarks)<>'' then v_metadata:=v_metadata||jsonb_build_object('remarks',p_remarks); end if;
  v_body:=jsonb_build_object('uuid',v_profile_revision_id,'metadata',v_metadata,
    'imports',jsonb_build_array(jsonb_build_object('href','#'||v_base_resource::text,'include-all','{}'::jsonb)),
    'merge',jsonb_build_object('as-is',true),
    'back-matter',jsonb_build_object('resources',jsonb_build_array(
      jsonb_build_object('uuid',v_base_resource,'title',v_base_profile.title,'props',jsonb_build_array(jsonb_build_object('name','document-revision-id','ns','urn:program-assurance:profile-authoring','value',v_base_doc.id)),
        'rlinks',jsonb_build_array(jsonb_build_object('href','urn:uuid:'||v_base_doc.id::text,'media-type','application/oscal.profile+json','hashes',jsonb_build_array(jsonb_build_object('algorithm','SHA-256','value',v_base_doc.content_sha256))))),
      jsonb_build_object('uuid',v_catalog_resource,'title',v_catalog.title,'props',jsonb_build_array(jsonb_build_object('name','document-revision-id','ns','urn:program-assurance:profile-authoring','value',v_catalog_doc.id)),
        'rlinks',jsonb_build_array(jsonb_build_object('href','urn:uuid:'||v_catalog_doc.id::text,'media-type','application/oscal.catalog+json','hashes',jsonb_build_array(jsonb_build_object('algorithm','SHA-256','value',v_catalog_doc.content_sha256)))))
    )));
  if jsonb_array_length(v_exclude_sources)>0 then v_body:=jsonb_set(v_body,'{imports,0,exclude-controls}',v_exclude_sources); end if;
  if v_include_sources is not null then
    v_body:=v_body||jsonb_build_object('imports',(v_body->'imports')||jsonb_build_array(jsonb_build_object('href','#'||v_catalog_resource::text,'include-controls',v_include_directives)));
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('param-id',p.source_id,'values',e.value->'values') order by public.wizard_control_order(p.source_id)),'[]') into v_normalized
    from jsonb_each(v_effective) e join public.parameters p on p.id=e.key::uuid where e.value->>'origin'='override';
  select coalesce(jsonb_object_agg(p.source_id,e.value->'values'),'{}') into v_output from jsonb_each(v_effective) e join public.parameters p on p.id=e.key::uuid;
  if jsonb_array_length(v_normalized)>0 then v_body:=v_body||jsonb_build_object('modify',jsonb_build_object('set-parameters',v_normalized)); end if;
  v_document:=jsonb_build_object('profile',v_body);
  v_document_sha:=encode(extensions.digest(v_document::text,'sha256'),'hex');
  -- Normalized rows, all draft until the end.
  insert into public.oscal_documents(id,tenant_id,model,title,code) values(v_document_id,p_tenant_id,'profile',p_title,p_code);
  insert into public.oscal_document_revisions(id,tenant_id,document_id,source_uuid,document_version,oscal_version,title,last_modified,content_sha256,original_content,metadata)
    values(v_document_revision_id,p_tenant_id,v_document_id,v_profile_revision_id,'1',v_catalog_doc.oscal_version,p_title,v_now,v_document_sha,v_document,v_metadata);
  insert into public.profiles(id,tenant_id,code,title) values(v_profile_id,p_tenant_id,p_code,p_title);
  insert into public.profile_revisions(id,tenant_id,profile_id,document_revision_id,version,title) values(v_profile_revision_id,p_tenant_id,v_profile_id,v_document_revision_id,'1',p_title);
  insert into public.oscal_document_imports(tenant_id,document_revision_id,referenced_revision_id,href,resolved_uri,resolution_status,ordinal)
    values(p_tenant_id,v_document_revision_id,v_base_doc.id,'#'||v_base_resource::text,'urn:uuid:'||v_base_doc.id::text,'resolved',0) returning id into v_doc_import;
  insert into public.profile_imports(tenant_id,profile_revision_id,imported_profile_revision_id,document_import_id,href,ordinal,include_all)
    values(p_tenant_id,v_profile_revision_id,v_base_profile.id,v_doc_import,'#'||v_base_resource::text,0,true) returning id into v_import0;
  if v_include_sources is not null then
    insert into public.oscal_document_imports(tenant_id,document_revision_id,referenced_revision_id,href,resolved_uri,resolution_status,ordinal)
      values(p_tenant_id,v_document_revision_id,v_catalog_doc.id,'#'||v_catalog_resource::text,'urn:uuid:'||v_catalog_doc.id::text,'resolved',1) returning id into v_doc_import;
    insert into public.profile_imports(tenant_id,profile_revision_id,catalog_revision_id,document_import_id,href,ordinal,include_all)
      values(p_tenant_id,v_profile_revision_id,p_catalog_id,v_doc_import,'#'||v_catalog_resource::text,1,false) returning id into v_import1;
    v_ordinal:=0;
    for v_control in select c.* from public.controls c where c.id=any(v_included) order by public.wizard_control_order(c.source_id),c.id loop
      select value into v_decision from jsonb_array_elements(p_decisions) where value->>'controlId'=v_control.id::text;
      insert into public.profile_rules(tenant_id,profile_revision_id,profile_import_id,kind,ordinal,source_pointer,definition,rationale)
        values(p_tenant_id,v_profile_revision_id,v_import1,'include',v_ordinal,'/profile/imports/1/include-controls/'||v_ordinal,jsonb_build_object('with-child-controls','no','with-ids',jsonb_build_array(v_control.source_id)),btrim(v_decision->>'rationale')) returning id into v_rule_id;
      v_include_rules:=v_include_rules||jsonb_build_object(v_control.id::text,jsonb_build_object('rule',v_rule_id,'ordinal',v_ordinal));
      v_ordinal:=v_ordinal+1;
    end loop;
  end if;
  insert into public.profile_rules(tenant_id,profile_revision_id,kind,ordinal,source_pointer,definition) values(p_tenant_id,v_profile_revision_id,'merge',0,'/profile/merge','{"as-is":true}');
  v_ordinal:=0;
  for v_decision in select value from jsonb_array_elements(p_decisions) where value->>'action'='exclude' loop
    select * into v_control from public.controls where id=(v_decision->>'controlId')::uuid;
    insert into public.profile_rules(tenant_id,profile_revision_id,profile_import_id,kind,ordinal,source_pointer,definition,rationale)
      values(p_tenant_id,v_profile_revision_id,v_import0,'exclude',v_ordinal,'/profile/imports/0/exclude-controls/'||v_ordinal,jsonb_build_object('with-child-controls','no','with-ids',jsonb_build_array(v_control.source_id)),btrim(v_decision->>'rationale'));
    v_ordinal:=v_ordinal+1;
  end loop;
  v_ordinal:=0;
  for v_entry in select e.key,e.value,p.source_id from jsonb_each(v_effective) e join public.parameters p on p.id=e.key::uuid where e.value->>'origin'='override' order by public.wizard_control_order(p.source_id) loop
    insert into public.profile_parameter_settings(tenant_id,profile_revision_id,parameter_id,parameter_source_id,rationale) values(p_tenant_id,v_profile_revision_id,v_entry.key::uuid,v_entry.source_id,v_entry.value->>'rationale') returning id into v_setting_id;
    insert into public.profile_parameter_values(tenant_id,setting_id,ordinal,value) select p_tenant_id,v_setting_id,(v.ordinality-1)::integer,v.value#>>'{}' from jsonb_array_elements(v_entry.value->'values') with ordinality v(value,ordinality);
    insert into public.profile_rules(tenant_id,profile_revision_id,kind,ordinal,source_pointer,definition,rationale)
      values(p_tenant_id,v_profile_revision_id,'set-parameter',v_ordinal,'/profile/modify/set-parameters/'||v_ordinal,jsonb_build_object('param-id',v_entry.source_id,'values',v_entry.value->'values'),v_entry.value->>'rationale');
    v_ordinal:=v_ordinal+1;
  end loop;
  insert into public.oscal_document_resources(tenant_id,document_revision_id,source_uuid,title,source_content)
    select p_tenant_id,v_document_revision_id,(resource->>'uuid')::uuid,resource->>'title',resource from jsonb_array_elements(v_body->'back-matter'->'resources') resource;
  insert into public.profile_resolutions(id,tenant_id,profile_revision_id,resolver_name,resolver_version,base_profile_resolution_id,input_sha256,output_sha256,resolved_at)
    values(v_resolution_id,p_tenant_id,v_profile_revision_id,'program-assurance-layered-profile','1',p_base_resolution_id,
      encode(extensions.digest(jsonb_build_object('resolver','program-assurance-layered-profile/1','baseResolutionId',p_base_resolution_id,'baseInputHash',v_base.input_sha256,'baseOutputHash',v_base.output_sha256,'catalogHash',v_catalog_doc.content_sha256,'decisions',p_decisions,'parameters',v_effective,'authoredDocumentHash',v_document_sha)::text,'sha256'),'hex'),
      encode(extensions.digest(jsonb_build_object('controls',v_selected_sources,'parameters',v_output)::text,'sha256'),'hex'),v_now);
  insert into public.profile_resolution_inputs(tenant_id,profile_resolution_id,document_revision_id,ordinal) values(p_tenant_id,v_resolution_id,v_document_revision_id,0);
  v_ordinal:=1;
  for v_input in select distinct id from (select v_catalog_doc.id union select v_base_doc.id union select i.document_revision_id from public.profile_resolution_inputs i where i.profile_resolution_id=p_base_resolution_id) inputs(id) order by id loop
    insert into public.profile_resolution_inputs(tenant_id,profile_resolution_id,document_revision_id,ordinal) values(p_tenant_id,v_resolution_id,v_input.id,v_ordinal); v_ordinal:=v_ordinal+1;
  end loop;
  v_ordinal:=0;
  for v_control in select * from public.controls where id=any(v_selected) order by public.wizard_control_order(source_id),id loop
    insert into public.selected_controls(tenant_id,profile_resolution_id,control_id,ordinal) values(p_tenant_id,v_resolution_id,v_control.id,v_ordinal) returning id into v_selected_id;
    if v_control.id=any(v_included) then
      select value into v_decision from jsonb_array_elements(p_decisions) where value->>'controlId'=v_control.id::text;
      insert into public.selection_provenance(tenant_id,selected_control_id,profile_import_id,profile_rule_id,source_pointer,rationale)
        values(p_tenant_id,v_selected_id,v_import1,(v_include_rules->(v_control.id::text)->>'rule')::uuid,'/profile/imports/1/include-controls/'||(v_include_rules->(v_control.id::text)->>'ordinal')||'/with-ids/0',btrim(v_decision->>'rationale'));
    else
      insert into public.selection_provenance(tenant_id,selected_control_id,profile_import_id,profile_rule_id,source_pointer,rationale)
        values(p_tenant_id,v_selected_id,v_import0,null,'/profile/imports/0/include-all','Inherited through include-all from base profile resolution '||p_base_resolution_id::text||' ('||v_base_profile.title||')');
    end if;
    v_ordinal:=v_ordinal+1;
  end loop;
  -- Publish bottom-up: children are in, so the guards freeze the whole authored profile.
  update public.profile_resolutions set state='published',revision=revision+1 where id=v_resolution_id;
  update public.profile_revisions set state='published',revision=revision+1 where id=v_profile_revision_id;
  update public.oscal_document_revisions set state='published',published_at=v_now,revision=revision+1 where id=v_document_revision_id;
  return v_resolution_id;
end; $$;
revoke all on function public.author_tailored_profile(uuid,uuid,uuid,jsonb,jsonb,text,text,text) from public,anon,authenticated;
comment on function public.author_tailored_profile(uuid,uuid,uuid,jsonb,jsonb,text,text,text) is 'Author and publish a profile layered on a base resolution: the base imported with include-all and one exclusion per control tailored out, the catalog imported with one inclusion per control tailored in (each with its rationale), parameter overrides under modify; normalized rows, a layered resolution, selected controls and provenance.';

-- ---------------------------------------------------------------------------------------------
-- One library component onto one element: shared by Add from library and the program wizard.
-- No locking, CAS or revision bump here; the callers own those.
-- ---------------------------------------------------------------------------------------------
create function public.apply_library_component(
  p_tenant_id uuid,p_program_id uuid,p_assignment_id uuid,
  p_revision public.component_definition_revisions,p_defined public.defined_components,p_target public.systems,
  p_code text,p_name text,p_control_filter uuid[],p_excluded jsonb,p_rationale text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_boundary uuid; v_element uuid; v_existing uuid; v_component uuid; v_ssp public.ssp_revisions; v_impl public.defined_component_implementations; v_seeded jsonb;
  v_accepted integer:=0; v_excluded integer:=0; v_not_in_baseline integer:=0; v_no_ssp integer:=0;
begin
  v_boundary:=p_target.boundary_system_id;
  v_element:=case when p_target.is_authorization_boundary then null else p_target.id end;
  select c.id into v_existing from public.system_components c
    where c.tenant_id=p_tenant_id and c.system_id=v_boundary and c.system_element_id is not distinct from v_element and c.defined_component_id=p_defined.id;
  if v_existing is not null then
    insert into public.library_assignment_targets(tenant_id,assignment_id,system_id,system_component_id,state,note)
      values(p_tenant_id,p_assignment_id,p_target.id,v_existing,'already_applied','This library component is already applied here');
    return jsonb_build_object('systemId',p_target.id,'systemComponentId',v_existing,'state','already_applied');
  end if;
  if exists(select 1 from public.system_components where tenant_id=p_tenant_id and system_id=v_boundary and code=btrim(p_code)) then
    raise exception 'Component code % is already used in this boundary',p_code using errcode='23505';
  end if;
  insert into public.system_components(tenant_id,system_id,system_element_id,defined_component_id,code,name,component_type,status,version,description,applied_rationale,applied_at,applied_by,assignment_id)
    values(p_tenant_id,v_boundary,v_element,p_defined.id,btrim(p_code),coalesce(nullif(btrim(p_name),''),p_defined.name),p_defined.component_type,'planned',p_revision.version_number::text,p_defined.description,p_rationale,now(),auth.uid(),p_assignment_id)
    returning id into v_component;
  select * into v_ssp from public.ssp_revisions where tenant_id=p_tenant_id and system_id=v_boundary and state='draft' order by version_number desc limit 1;
  for v_impl in select * from public.defined_component_implementations i
    where i.tenant_id=p_tenant_id and i.defined_component_id=p_defined.id and i.control_id is not null
      and (p_control_filter is null or i.control_id=any(p_control_filter))
    order by i.id loop
    v_seeded:=public.seed_library_contribution(p_tenant_id,p_program_id,p_assignment_id,p_target.id,v_component,v_ssp.id,v_ssp.profile_resolution_id,v_impl,
      exists(select 1 from jsonb_array_elements(coalesce(p_excluded,'[]'::jsonb)) e where (e->>'systemId')::uuid=p_target.id and (e->>'controlId')::uuid=v_impl.control_id),null);
    case v_seeded->>'state'
      when 'accepted' then v_accepted:=v_accepted+1;
      when 'excluded' then v_excluded:=v_excluded+1;
      when 'not_in_baseline' then v_not_in_baseline:=v_not_in_baseline+1;
      else v_no_ssp:=v_no_ssp+1;
    end case;
  end loop;
  return jsonb_build_object('systemId',p_target.id,'systemComponentId',v_component,'state','accepted',
    'accepted',v_accepted,'excluded',v_excluded,'notInBaseline',v_not_in_baseline,'noSsp',v_no_ssp);
end; $$;
revoke all on function public.apply_library_component(uuid,uuid,uuid,public.component_definition_revisions,public.defined_components,public.systems,text,text,uuid[],jsonb,text) from public,anon,authenticated;

-- Add from library, now able to make the component an element of the tree under the chosen parent.
create or replace function public.apply_library_source(p_tenant_id uuid,p_program_id uuid,p_request_id uuid,p_selection jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_receipt public.library_apply_requests; v_hash text; v_result jsonb; v_targets jsonb:='[]';
  v_revision public.component_definition_revisions; v_defined public.defined_components;
  v_target jsonb; v_system public.systems; v_element public.systems; v_spec jsonb; v_element_code text; v_element_name text; v_element_type text;
  v_existing uuid; v_existing_element uuid; v_assignment uuid; v_control_filter uuid[]; v_excluded jsonb; v_rationale text; v_include_descendants boolean; v_applied jsonb;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then raise exception 'Workspace write access is required' using errcode='42501'; end if;
  if p_request_id is null or jsonb_typeof(p_selection) is distinct from 'object' or jsonb_typeof(p_selection->'targets') is distinct from 'array' then
    raise exception 'Choose a library item and at least one element' using errcode='23514';
  end if;
  perform 1 from public.programs where tenant_id=p_tenant_id and id=p_program_id for no key update;
  if not found then raise exception 'Program was not found in this workspace' using errcode='23514'; end if;
  v_hash:=encode(extensions.digest(jsonb_build_object('programId',p_program_id,'selection',p_selection)::text,'sha256'),'hex');
  select * into v_receipt from public.library_apply_requests where id=p_request_id;
  if found then
    if v_receipt.tenant_id<>p_tenant_id or v_receipt.program_id<>p_program_id or v_receipt.payload_sha256<>v_hash then
      raise exception 'This apply request has already been used for different changes' using errcode='PT409';
    end if;
    return v_receipt.result;
  end if;
  select * into v_revision from public.component_definition_revisions where tenant_id=p_tenant_id and id=(p_selection->>'sourceRevisionId')::uuid;
  if v_revision.id is null then raise exception 'Library version was not found' using errcode='23514'; end if;
  if v_revision.state<>'published' then raise exception 'Only a published library version can be applied' using errcode='23514'; end if;
  select * into v_defined from public.defined_components where tenant_id=p_tenant_id and id=(p_selection->>'definedComponentId')::uuid and component_definition_revision_id=v_revision.id;
  if v_defined.id is null then raise exception 'Choose a component of the selected library version' using errcode='23514'; end if;
  v_rationale:=nullif(btrim(p_selection->>'rationale'),'');
  if v_rationale is null or length(v_rationale)>10000 then raise exception 'Record why this library item applies here' using errcode='23514'; end if;
  v_include_descendants:=coalesce((p_selection->>'includeDescendants')::boolean,false);
  if jsonb_typeof(p_selection->'controlIds')='array' then
    select coalesce(array_agg(distinct value::uuid),'{}') into v_control_filter from jsonb_array_elements_text(p_selection->'controlIds');
  end if;
  v_excluded:=coalesce(p_selection->'excluded','[]');
  if jsonb_array_length(p_selection->'targets')=0 then raise exception 'Choose at least one element' using errcode='23514'; end if;
  insert into public.library_assignments(tenant_id,program_id,system_id,source_revision_id,include_descendants,control_ids,rationale,accepted_by,request_id)
    values(p_tenant_id,p_program_id,(p_selection->'targets'->0->>'systemId')::uuid,v_revision.id,v_include_descendants,v_control_filter,v_rationale,auth.uid(),p_request_id)
    returning id into v_assignment;
  for v_target in select value from jsonb_array_elements(p_selection->'targets') loop
    select * into v_system from public.systems where tenant_id=p_tenant_id and id=(v_target->>'systemId')::uuid for update;
    if v_system.id is null or v_system.program_id<>p_program_id then raise exception 'Element was not found in this program' using errcode='23514'; end if;
    if v_system.revision is distinct from (v_target->>'expectedRevision')::bigint then
      raise exception 'The element % changed; reload before applying',v_system.code using errcode='PT409';
    end if;
    v_spec:=case when jsonb_typeof(v_target->'createElement')='object' then v_target->'createElement' end;
    if v_spec is not null then
      v_element_code:=public.wizard_required_text(v_spec,'code');
      v_element_name:=public.wizard_required_text(v_spec,'name');
      v_element_type:=public.element_type_for_component(v_defined.component_type);
      if nullif(v_spec->>'type','') is not null and v_spec->>'type'<>v_element_type then raise exception 'Library elements take their type from the component definition' using errcode='23514'; end if;
      select c.id,e.id into v_existing,v_existing_element from public.system_components c join public.systems e on e.tenant_id=c.tenant_id and e.id=c.system_element_id
        where c.tenant_id=p_tenant_id and c.system_id=v_system.boundary_system_id and c.defined_component_id=v_defined.id and e.parent_system_id=v_system.id limit 1;
      if v_existing is not null then
        insert into public.library_assignment_targets(tenant_id,assignment_id,system_id,system_component_id,state,note)
          values(p_tenant_id,v_assignment,v_existing_element,v_existing,'already_applied','This library component is already an element here');
        v_targets:=v_targets||jsonb_build_object('systemId',v_system.id,'elementId',v_existing_element,'systemComponentId',v_existing,'state','already_applied');
        continue;
      end if;
      if exists(select 1 from public.systems where tenant_id=p_tenant_id and boundary_system_id=v_system.boundary_system_id and not is_authorization_boundary and lower(code)=lower(v_element_code)) then
        raise exception 'Element code % is already used in this boundary',v_element_code using errcode='23505';
      end if;
      insert into public.systems(tenant_id,program_id,parent_system_id,is_authorization_boundary,code,name,description,system_type)
        values(p_tenant_id,p_program_id,v_system.id,false,v_element_code,v_element_name,coalesce(nullif(btrim(v_spec->>'description'),''),v_defined.description),v_element_type)
        returning * into v_element;
      v_applied:=public.apply_library_component(p_tenant_id,p_program_id,v_assignment,v_revision,v_defined,v_element,btrim(v_target->>'code'),v_target->>'name',v_control_filter,
        (select coalesce(jsonb_agg(case when (e->>'systemId')::uuid=v_system.id then e||jsonb_build_object('systemId',v_element.id) else e end),'[]') from jsonb_array_elements(v_excluded) e),v_rationale);
      v_applied:=v_applied||jsonb_build_object('systemId',v_system.id,'elementId',v_element.id);
    else
      v_applied:=public.apply_library_component(p_tenant_id,p_program_id,v_assignment,v_revision,v_defined,v_system,btrim(v_target->>'code'),v_target->>'name',v_control_filter,v_excluded,v_rationale);
    end if;
    if v_applied->>'state'='already_applied' then v_targets:=v_targets||v_applied; continue; end if;
    update public.systems set revision=revision+1 where tenant_id=p_tenant_id and id=v_system.id;
    v_targets:=v_targets||v_applied;
  end loop;
  v_result:=jsonb_build_object('assignmentId',v_assignment,'sourceRevisionId',v_revision.id,'definedComponentId',v_defined.id,'targets',v_targets);
  insert into public.library_apply_requests(id,tenant_id,program_id,payload_sha256,result,created_by) values(p_request_id,p_tenant_id,p_program_id,v_hash,v_result,auth.uid());
  return v_result;
end; $$;
revoke all on function public.apply_library_source(uuid,uuid,uuid,jsonb) from public,anon;
grant execute on function public.apply_library_source(uuid,uuid,uuid,jsonb) to authenticated;
comment on function public.apply_library_source(uuid,uuid,uuid,jsonb) is 'Apply one component of a published library version to one or more elements: a pinned component instance per element (or, with createElement, a new child element of the tree carrying the instance), contributions seeded into the boundary''s draft SSP for controls in its selection, library evidence proposed as uses, and an assignment recording every target and why. Same request retries reconcile; element CAS prevents lost updates.';

-- ---------------------------------------------------------------------------------------------
-- The program wizard, v2: program profiles layered on chosen bases, systems adopting one each,
-- elements written straight into the tree, library components seeded as elements.
-- ---------------------------------------------------------------------------------------------
create or replace function public.create_program_wizard(p_tenant_id uuid,p_draft jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_request uuid; v_hash text; v_receipt public.program_wizard_requests; v_program uuid:=gen_random_uuid(); v_actor uuid; v_code text;
  v_catalog_id uuid; v_catalog public.catalog_revisions; v_catalog_doc public.oscal_document_revisions;
  v_profile jsonb; v_system jsonb; v_element jsonb; v_role jsonb;
  v_profile_map jsonb:='{}'; v_profile_results jsonb:='[]'; v_base uuid; v_resolution uuid; v_index integer:=0;
  v_base_profile public.profile_revisions; v_base_resolution public.profile_resolutions;
  v_system_id uuid; v_ssp uuid; v_node_map jsonb; v_left integer; v_progress boolean; v_parent uuid; v_element_id uuid; v_type text; v_rationale text;
  v_revision public.component_definition_revisions; v_defined public.defined_components; v_element_row public.systems; v_assignment uuid; v_applied jsonb;
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
      v_resolution:=public.author_tailored_profile(p_tenant_id,v_catalog_id,v_base,v_profile->'tailoring',v_profile->'parameters',
        v_code||'/profiles/'||v_index,v_base_profile.title||' — '||v_code||' overlay','Program overlay authored during program creation.');
    end if;
    insert into public.program_reference_choices(tenant_id,program_id,catalog_revision_id,profile_resolution_id) values(p_tenant_id,v_program,v_catalog_id,v_resolution);
    v_profile_map:=v_profile_map||jsonb_build_object(v_profile->>'key',v_resolution);
    v_profile_results:=v_profile_results||jsonb_build_object('key',v_profile->>'key','profileResolutionId',v_resolution,'tailored',v_resolution<>v_base);
  end loop;
  -- Systems, their elements, a draft SSP each, then the library components.
  for v_system in select value from jsonb_array_elements(p_draft->'systems') loop
    perform public.wizard_required_text(v_system,'key')::uuid;
    if (v_system->>'confidentiality') is null or (v_system->>'integrity') is null or (v_system->>'availability') is null then raise exception 'Choose confidentiality, integrity, and availability for every system' using errcode='23514'; end if;
    if coalesce(v_system->>'type','') not in ('information_system','industrial_control_system','platform','service') then raise exception 'Choose a system type' using errcode='23514'; end if;
    if jsonb_typeof(v_system->'elements') is distinct from 'array' or jsonb_array_length(v_system->'elements')>300 then raise exception 'Invalid system composition' using errcode='23514'; end if;
    v_resolution:=(v_profile_map->>(v_system->>'profileKey'))::uuid;
    if v_resolution is null then raise exception 'Choose a program profile for every system' using errcode='23514'; end if;
    v_rationale:=public.wizard_required_text(v_system,'categorizationRationale');
    v_system_id:=gen_random_uuid();
    insert into public.systems(id,tenant_id,program_id,code,name,description,system_type,system_owner_party_id,confidentiality_impact,integrity_impact,availability_impact,categorization_rationale,adopted_profile_resolution_id,baseline_rationale)
      values(v_system_id,p_tenant_id,v_program,public.wizard_required_text(v_system,'code'),public.wizard_required_text(v_system,'name'),nullif(btrim(v_system->>'description'),''),v_system->>'type',nullif(v_system->>'ownerPartyId','')::uuid,
        v_system->>'confidentiality',v_system->>'integrity',v_system->>'availability',v_rationale,v_resolution,'Program profile adopted during program creation.');
    if exists(select 1 from jsonb_array_elements(v_system->'elements') n group by n->>'key' having count(*)>1)
      or exists(select 1 from jsonb_array_elements(v_system->'elements') n group by lower(btrim(n->>'code')) having count(*)>1) then raise exception 'Element codes and identifiers must be distinct' using errcode='23514'; end if;
    v_node_map:='{}'; v_left:=jsonb_array_length(v_system->'elements');
    while v_left>0 loop
      v_progress:=false;
      for v_element in select value from jsonb_array_elements(v_system->'elements') loop
        perform public.wizard_required_text(v_element,'key')::uuid;
        if v_node_map ? (v_element->>'key') then continue; end if;
        if nullif(v_element->>'parentKey','') is not null and not v_node_map ? (v_element->>'parentKey') then continue; end if;
        v_parent:=coalesce((v_node_map->>(v_element->>'parentKey'))::uuid,v_system_id);
        v_element_id:=gen_random_uuid();
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
          v_type:=v_element->>'type';
          if v_type is null or v_type not in ('subsystem','hardware','software','network','service','facility','data','other') then raise exception 'Choose an element type' using errcode='23514'; end if;
        end if;
        insert into public.systems(id,tenant_id,program_id,parent_system_id,is_authorization_boundary,code,name,description,system_type)
          values(v_element_id,p_tenant_id,v_program,v_parent,false,public.wizard_required_text(v_element,'code'),public.wizard_required_text(v_element,'name'),nullif(btrim(v_element->>'description'),''),v_type);
        v_node_map:=v_node_map||jsonb_build_object(v_element->>'key',v_element_id); v_left:=v_left-1; v_progress:=true;
      end loop;
      if not v_progress then raise exception 'Choose element parents within the same system without cycles' using errcode='23514'; end if;
    end loop;
    insert into public.ssp_revisions(tenant_id,system_id,profile_resolution_id,version_number,description) values(p_tenant_id,v_system_id,v_resolution,1,'Draft SSP initialized from the program profile adopted at creation.') returning id into v_ssp;
    insert into public.implemented_requirements(tenant_id,ssp_revision_id,selected_control_id) select p_tenant_id,v_ssp,id from public.selected_controls where profile_resolution_id=v_resolution;
    for v_element in select value from jsonb_array_elements(v_system->'elements') loop
      select * into v_element_row from public.systems where id=(v_node_map->>(v_element->>'key'))::uuid;
      if jsonb_typeof(v_element->'library')='object' then
        select * into v_revision from public.component_definition_revisions where tenant_id=p_tenant_id and id=(v_element->'library'->>'revisionId')::uuid;
        select * into v_defined from public.defined_components where tenant_id=p_tenant_id and id=(v_element->'library'->>'definedComponentId')::uuid;
        insert into public.library_assignments(tenant_id,program_id,system_id,source_revision_id,include_descendants,control_ids,rationale,accepted_by,request_id)
          values(p_tenant_id,v_program,v_element_row.id,v_revision.id,false,null,btrim(v_element->'library'->>'rationale'),auth.uid(),v_request) returning id into v_assignment;
        v_applied:=public.apply_library_component(p_tenant_id,v_program,v_assignment,v_revision,v_defined,v_element_row,v_element_row.code,v_element_row.name,null,'[]'::jsonb,btrim(v_element->'library'->>'rationale'));
        v_element_results:=v_element_results||jsonb_build_object('key',v_element->>'key','systemId',v_element_row.id,'systemComponentId',v_applied->'systemComponentId');
      else
        v_element_results:=v_element_results||jsonb_build_object('key',v_element->>'key','systemId',v_element_row.id,'systemComponentId',null);
      end if;
    end loop;
    v_system_ids:=v_system_ids||jsonb_build_array(v_system_id);
  end loop;
  v_result:=jsonb_build_object('programId',v_program,'systemIds',v_system_ids,'profiles',v_profile_results,'elements',v_element_results);
  insert into public.program_wizard_requests(id,tenant_id,program_id,payload_sha256,result,created_by) values(v_request,p_tenant_id,v_program,v_hash,v_result,auth.uid());
  return v_result;
end; $$;
revoke all on function public.create_program_wizard(uuid,jsonb) from public,anon;
grant execute on function public.create_program_wizard(uuid,jsonb) to authenticated;
comment on function public.create_program_wizard(uuid,jsonb) is 'One transaction: the program, its roles, one program profile per chosen base (the base as-is or a published overlay layered on it), systems adopting one each with their elements written into the tree, a draft SSP per system, and library components applied as elements. Idempotent per request id.';
comment on table public.program_reference_choices is 'One row per program profile: the exact published catalog edition and the resolution the program adopts, the base itself or the overlay authored on it.';

-- ---------------------------------------------------------------------------------------------
-- A system's own tailoring layers on whatever it adopts, the program profile included.
-- ---------------------------------------------------------------------------------------------
create or replace function public.adopt_system_baseline(p_tenant_id uuid,p_system_id uuid,p_expected_revision integer,p_request_id uuid,p_selection jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_target public.systems; v_receipt public.system_baseline_requests; v_hash text; v_result jsonb; v_program uuid;
  v_catalog uuid; v_chosen uuid; v_base_ids uuid[]; v_selected uuid[]; v_decisions jsonb; v_resolution uuid; v_rationale text;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then raise exception 'Workspace write access is required' using errcode='42501'; end if;
  if p_request_id is null or jsonb_typeof(p_selection) is distinct from 'object' then raise exception 'Enter a baseline selection' using errcode='23514'; end if;
  select program_id into v_program from public.systems where tenant_id=p_tenant_id and id=p_system_id;
  if v_program is null then raise exception 'System was not found in this workspace' using errcode='23514'; end if;
  perform 1 from public.programs where tenant_id=p_tenant_id and id=v_program for no key update;
  select * into v_target from public.systems where tenant_id=p_tenant_id and id=p_system_id for update;
  v_hash:=encode(extensions.digest(jsonb_build_object('systemId',p_system_id,'revision',p_expected_revision,'selection',p_selection)::text,'sha256'),'hex');
  select * into v_receipt from public.system_baseline_requests where id=p_request_id;
  if found then
    if v_receipt.tenant_id<>p_tenant_id or v_receipt.system_id<>p_system_id or v_receipt.payload_sha256<>v_hash then raise exception 'This save request has already been used for different changes' using errcode='PT409'; end if;
    return v_receipt.result;
  end if;
  if v_target.revision is distinct from p_expected_revision then raise exception 'The system changed; reload before changing its baseline' using errcode='PT409'; end if;
  if p_selection->>'mode'='inherit' then
    v_resolution:=null; v_rationale:=null;
  elsif p_selection->>'mode'='adopt' then
    v_catalog:=(p_selection->>'catalogRevisionId')::uuid;
    v_chosen:=(p_selection->>'profileResolutionId')::uuid;
    v_base_ids:=public.resolve_base_controls(p_tenant_id,v_catalog,v_chosen,0);
    if jsonb_typeof(p_selection->'controlIds') is distinct from 'array' then raise exception 'Choose the controls for this baseline' using errcode='23514'; end if;
    select coalesce(array_agg(distinct value::uuid order by value::uuid),'{}') into v_selected from jsonb_array_elements_text(p_selection->'controlIds');
    if cardinality(v_selected)=0 or exists(select 1 from unnest(v_selected) picked(id) where not exists(select 1 from public.controls c where c.id=picked.id and c.catalog_revision_id=v_catalog and (c.tenant_id is null or c.tenant_id=p_tenant_id))) then raise exception 'Choose at least one control from the selected catalog' using errcode='23514'; end if;
    v_rationale:=nullif(btrim(p_selection->>'rationale'),'');
    if v_selected is not distinct from v_base_ids and jsonb_array_length(coalesce(p_selection->'parameters','[]'::jsonb))=0 then
      v_resolution:=v_chosen;
    else
      if v_rationale is null or length(v_rationale)>10000 then raise exception 'Record why this baseline is tailored' using errcode='23514'; end if;
      select coalesce(jsonb_agg(jsonb_build_object('controlId',id,'action',case when id=any(v_base_ids) then 'exclude' else 'include' end,'rationale',v_rationale) order by id),'[]') into v_decisions
        from (select distinct id from unnest(v_base_ids||v_selected) id) ids where (id=any(v_base_ids)) is distinct from (id=any(v_selected));
      v_resolution:=public.author_tailored_profile(p_tenant_id,v_catalog,v_chosen,v_decisions,coalesce(p_selection->'parameters','[]'::jsonb),
        'system/'||v_target.id::text||'/baseline/'||p_request_id::text,v_target.name||' — tailored baseline',v_rationale);
    end if;
  else raise exception 'Choose adoption or inheritance' using errcode='23514'; end if;
  if v_target.adopted_profile_resolution_id is distinct from v_resolution or v_target.baseline_rationale is distinct from v_rationale then
    update public.systems set adopted_profile_resolution_id=v_resolution,baseline_rationale=v_rationale,revision=p_expected_revision+1
      where tenant_id=p_tenant_id and id=p_system_id returning * into v_target;
  end if;
  v_result:=jsonb_build_object('systemId',v_target.id,'profileResolutionId',v_target.adopted_profile_resolution_id,'revision',v_target.revision);
  insert into public.system_baseline_requests(id,tenant_id,system_id,payload_sha256,result,created_by) values(p_request_id,p_tenant_id,p_system_id,v_hash,v_result,auth.uid());
  return v_result;
end; $$;
revoke all on function public.adopt_system_baseline(uuid,uuid,integer,uuid,jsonb) from public,anon;
grant execute on function public.adopt_system_baseline(uuid,uuid,integer,uuid,jsonb) to authenticated;
comment on function public.adopt_system_baseline(uuid,uuid,integer,uuid,jsonb) is 'Atomically adopt a published resolved profile (a reference profile or a program overlay), or author and publish a profile layered on it for intentional control additions/removals and adopt that. Same request retries reconcile; system CAS prevents lost updates. Never rewrites SSP history.';
