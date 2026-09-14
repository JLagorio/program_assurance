-- The confirmed program wizard is one transaction. It does not approve or
-- publish its authored profiles, resolutions, SSPs, or implementation claims.
alter table public.systems add column categorization_rationale text;
alter table public.scopes add column categorization_rationale text;

create table public.program_reference_choices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  program_id uuid not null,
  catalog_revision_id uuid not null references public.catalog_revisions(id),
  profile_resolution_id uuid not null references public.profile_resolutions(id),
  unique (tenant_id,id), unique (tenant_id,program_id,profile_resolution_id),
  foreign key (tenant_id,program_id) references public.programs(tenant_id,id)
);
select public.apply_tenant_security('program_reference_choices');
select public.attach_record_lifecycle('program_reference_choices');
select public.attach_reference_tenant_guard('program_reference_choices','catalog_revision_id','catalog_revisions');
select public.attach_reference_tenant_guard('program_reference_choices','profile_resolution_id','profile_resolutions');
comment on table public.program_reference_choices is 'The exact published catalog and candidate profile resolutions explicitly chosen in the program wizard.';

create table public.program_wizard_requests (
  id uuid primary key,
  tenant_id uuid not null references public.tenants(id),
  program_id uuid not null,
  payload_sha256 text not null check (payload_sha256 ~ '^[a-f0-9]{64}$'),
  result jsonb not null check (jsonb_typeof(result)='object'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (tenant_id,id),
  foreign key (tenant_id,program_id) references public.programs(tenant_id,id)
);
alter table public.program_wizard_requests enable row level security;
revoke all on public.program_wizard_requests from public,anon,authenticated;
grant select on public.program_wizard_requests to authenticated;
create policy wizard_request_read on public.program_wizard_requests for select to authenticated using (public.can_read_tenant(tenant_id));
comment on table public.program_wizard_requests is 'Private command receipts: identical retries return the original result; changed payloads with the same request ID conflict.';

create function public.wizard_required_text(value jsonb, field_name text) returns text
language plpgsql immutable set search_path='' as $$
declare result text;
begin
  if jsonb_typeof(value->field_name) is distinct from 'string' then raise exception 'Enter %',field_name using errcode='23514'; end if;
  result:=btrim(value->>field_name);
  if length(result)=0 or length(result)>10000 then raise exception 'Enter a valid %',field_name using errcode='23514'; end if;
  return result;
end;
$$;
revoke all on function public.wizard_required_text(jsonb,text) from public,anon,authenticated;

create function public.wizard_control_order(source_identifier text) returns text
language sql immutable set search_path='' as $$
  select string_agg(case when part[1] ~ '^[0-9]+$' then lpad(part[1],12,'0') else part[1] end,'' order by position)
  from regexp_matches(source_identifier,'([0-9]+|[^0-9]+)','g') with ordinality parts(part,position);
$$;
revoke all on function public.wizard_control_order(text) from public,anon,authenticated;

-- Validate the deliberately supported explicit-ID profile subset and derive
-- its selection from original OSCAL, independently of the browser preview.
create function public.wizard_base_controls(p_tenant_id uuid,p_catalog_id uuid,p_resolution_id uuid)
returns uuid[] language plpgsql security definer set search_path='' as $$
declare
  catalog_row public.catalog_revisions; profile_row public.profile_revisions;
  resolution_row public.profile_resolutions; document_row public.oscal_document_revisions;
  body jsonb; imported jsonb; directive jsonb; source_value jsonb; control_uuid uuid;
  included uuid[]:='{}'; excluded uuid[]:='{}'; resolved uuid[]; recorded uuid[];
  import_row public.profile_imports; rule_row public.profile_rules; setting_row public.profile_parameter_settings;
  expected_rule jsonb; raw_settings jsonb; normalized_values jsonb; parameter_row public.parameters;
begin
  select * into catalog_row from public.catalog_revisions where id=p_catalog_id and (tenant_id is null or tenant_id=p_tenant_id) and state='published' for share;
  select * into resolution_row from public.profile_resolutions where id=p_resolution_id and (tenant_id is null or tenant_id=p_tenant_id) and state='published' for share;
  select * into profile_row from public.profile_revisions where id=resolution_row.profile_revision_id and (tenant_id is null or tenant_id=p_tenant_id) and state='published' for share;
  select * into document_row from public.oscal_document_revisions where id=profile_row.document_revision_id and (tenant_id is null or tenant_id=p_tenant_id) and state='published' for share;
  if catalog_row.id is null or resolution_row.id is null or profile_row.id is null or document_row.id is null or not exists(select 1 from public.oscal_document_revisions where id=catalog_row.document_revision_id and state='published') then
    raise exception 'Choose a published catalog and a published, resolved profile available to this workspace' using errcode='23514';
  end if;
  if not exists(select 1 from public.profile_resolution_inputs where profile_resolution_id=p_resolution_id and document_revision_id=catalog_row.document_revision_id)
    or not exists(select 1 from public.profile_resolution_inputs where profile_resolution_id=p_resolution_id and document_revision_id=document_row.id)
    or exists(select 1 from public.profile_resolution_inputs i join public.oscal_document_revisions d on d.id=i.document_revision_id where i.profile_resolution_id=p_resolution_id and (d.state<>'published' or (d.tenant_id is not null and d.tenant_id<>p_tenant_id))) then
    raise exception 'The base resolution must pin its published profile and catalog inputs' using errcode='23514';
  end if;
  body:=document_row.original_content->'profile';
  if jsonb_typeof(body->'imports') is distinct from 'array' or jsonb_array_length(body->'imports')<>1
    or body->'merge' is distinct from '{"as-is":true}'::jsonb
    or (body ? 'modify' and (jsonb_typeof(body->'modify')<>'object' or ((body->'modify')-'set-parameters')<>'{}'::jsonb)) then
    raise exception 'This profile uses unsupported imports, merge, or modification directives' using errcode='23514';
  end if;
  if (select count(*) from public.profile_imports where profile_revision_id=profile_row.id)<>1
    or not exists(select 1 from public.profile_imports where profile_revision_id=profile_row.id and catalog_revision_id=p_catalog_id and imported_profile_revision_id is null) then
    raise exception 'Choose a supported profile importing the exact selected catalog directly' using errcode='23514';
  end if;
  imported:=body->'imports'->0;
  select * into import_row from public.profile_imports where profile_revision_id=profile_row.id;
  if import_row.include_all is distinct from (imported ? 'include-all') then raise exception 'Normalized include-all does not match the profile source' using errcode='23514'; end if;
  if jsonb_typeof(imported)<>'object' or (imported-'href'-'include-all'-'include-controls'-'exclude-controls')<>'{}'::jsonb
    or (imported ? 'include-all' and imported ? 'include-controls') then
    raise exception 'The base profile import uses unsupported selection directives' using errcode='23514';
  end if;
  if imported ? 'include-all' then
    if imported->'include-all'<>'{}'::jsonb then raise exception 'Unsupported include-all selection' using errcode='23514'; end if;
    select coalesce(array_agg(id),'{}') into included from public.controls where catalog_revision_id=p_catalog_id;
  else
    if jsonb_typeof(imported->'include-controls') is distinct from 'array' then raise exception 'The profile must include explicit controls' using errcode='23514'; end if;
    for directive in select value from jsonb_array_elements(imported->'include-controls') loop
      if jsonb_typeof(directive->'with-ids') is distinct from 'array' or jsonb_array_length(directive->'with-ids')=0 or (directive-'with-ids'-'with-child-controls')<>'{}'::jsonb or coalesce(directive->>'with-child-controls','no')<>'no' then raise exception 'Matching and child expansion are not supported by this wizard' using errcode='23514'; end if;
      for source_value in select value from jsonb_array_elements(directive->'with-ids') loop
        select id into control_uuid from public.controls c where c.catalog_revision_id=p_catalog_id and c.source_id=(source_value#>>'{}');
        if jsonb_typeof(source_value)<>'string' or control_uuid is null then raise exception 'The profile references an unknown control' using errcode='23514'; end if;
        included:=array_append(included,control_uuid);
      end loop;
    end loop;
  end if;
  if imported ? 'exclude-controls' then
    if jsonb_typeof(imported->'exclude-controls')<>'array' then raise exception 'Invalid exclusion directives' using errcode='23514'; end if;
    for directive in select value from jsonb_array_elements(imported->'exclude-controls') loop
      if jsonb_typeof(directive->'with-ids') is distinct from 'array' or jsonb_array_length(directive->'with-ids')=0 or (directive-'with-ids'-'with-child-controls')<>'{}'::jsonb or coalesce(directive->>'with-child-controls','no')<>'no' then raise exception 'Unsupported exclusion directives' using errcode='23514'; end if;
      for source_value in select value from jsonb_array_elements(directive->'with-ids') loop
        select id into control_uuid from public.controls c where c.catalog_revision_id=p_catalog_id and c.source_id=(source_value#>>'{}');
        if control_uuid is null or not control_uuid=any(included) then raise exception 'Excluded profile controls must first be included' using errcode='23514'; end if;
        excluded:=array_append(excluded,control_uuid);
      end loop;
    end loop;
  end if;
  select coalesce(array_agg(distinct id order by id),'{}') into resolved from unnest(included) id where not id=any(excluded);
  select coalesce(array_agg(control_id order by control_id),'{}') into recorded from public.selected_controls where profile_resolution_id=p_resolution_id;
  if cardinality(resolved)=0 or resolved is distinct from recorded then raise exception 'The stored base resolution does not match its supported OSCAL selection' using errcode='23514'; end if;
  raw_settings:=coalesce(body->'modify'->'set-parameters','[]'::jsonb);
  if jsonb_typeof(raw_settings)<>'array' then raise exception 'Unsupported parameter modification' using errcode='23514'; end if;
  if exists(select 1 from jsonb_array_elements(raw_settings) item group by item->>'param-id' having count(*)>1) then raise exception 'The base profile repeats a parameter setting' using errcode='23514'; end if;
  if (select count(*) from public.profile_rules where profile_revision_id=profile_row.id)
    <> coalesce(jsonb_array_length(imported->'include-controls'),0)+coalesce(jsonb_array_length(imported->'exclude-controls'),0)+jsonb_array_length(raw_settings)+1 then
    raise exception 'The normalized profile rules do not match the source document' using errcode='23514';
  end if;
  for rule_row in select * from public.profile_rules where profile_revision_id=profile_row.id loop
    expected_rule:=case rule_row.kind
      when 'include' then imported->'include-controls'->rule_row.ordinal
      when 'exclude' then imported->'exclude-controls'->rule_row.ordinal
      when 'merge' then body->'merge'
      when 'set-parameter' then raw_settings->rule_row.ordinal
      else null end;
    if (rule_row.kind in ('include','exclude') and rule_row.profile_import_id is distinct from import_row.id) or expected_rule is null or expected_rule is distinct from rule_row.definition then raise exception 'Unsupported or inconsistent normalized profile rule' using errcode='23514'; end if;
  end loop;
  if (select count(*) from public.profile_parameter_settings where profile_revision_id=profile_row.id)<>jsonb_array_length(raw_settings) then raise exception 'The profile is missing normalized parameter values' using errcode='23514'; end if;
  for directive in select value from jsonb_array_elements(raw_settings) loop
    if (directive-'param-id'-'values')<>'{}'::jsonb or jsonb_typeof(directive->'values') is distinct from 'array' or jsonb_array_length(directive->'values')=0 then raise exception 'Only explicit parameter value assignments are supported' using errcode='23514'; end if;
    select * into parameter_row from public.parameters where catalog_revision_id=p_catalog_id and source_id=directive->>'param-id';
    select * into setting_row from public.profile_parameter_settings where profile_revision_id=profile_row.id and parameter_source_id=directive->>'param-id';
    select jsonb_agg(value order by ordinal) into normalized_values from public.profile_parameter_values where setting_id=setting_row.id;
    if parameter_row.id is null or parameter_row.control_id is null or not parameter_row.control_id=any(resolved)
      or setting_row.parameter_id is distinct from parameter_row.id or setting_row.label is not null or setting_row.usage is not null
      or normalized_values is distinct from directive->'values' then raise exception 'Base parameter settings must assign values to selected controls and match the source document' using errcode='23514'; end if;
    if exists(select 1 from jsonb_array_elements(directive->'values') v where jsonb_typeof(v)<>'string' or length(btrim(v#>>'{}'))=0) then raise exception 'Base parameter values cannot be empty' using errcode='23514'; end if;
  end loop;
  return resolved;
end;
$$;
revoke all on function public.wizard_base_controls(uuid,uuid,uuid) from public,anon,authenticated;

create function public.create_program_wizard(p_tenant_id uuid,p_draft jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
#variable_conflict use_column
<<wizard>>
declare
  request_id uuid; payload_hash text; receipt public.program_wizard_requests;
  program_id uuid:=gen_random_uuid(); actor_id uuid; catalog_id uuid;
  catalog_row public.catalog_revisions; catalog_doc public.oscal_document_revisions;
  system_item jsonb; node_item jsonb; role_item jsonb; decision jsonb; parameter_item jsonb; value_item jsonb;
  chosen_resolution uuid; base_ids uuid[]; selected_ids uuid[]; included_ids uuid[]; excluded_ids uuid[]; seen_ids uuid[];
  system_id uuid; scope_id uuid; ssp_id uuid; document_id uuid; document_revision_id uuid; profile_id uuid; profile_revision_id uuid; resolution_id uuid; import_id uuid; document_import_id uuid; include_rule_id uuid; rule_id uuid; selected_id uuid; setting_id uuid;
  node_map jsonb; parent_id uuid; nodes_left integer; made_progress boolean;
  base_resolution public.profile_resolutions; base_profile public.profile_revisions; base_doc public.oscal_document_revisions;
  control_row public.controls; parameter_row public.parameters; setting_row record; input_row record;
  parameter_values_json jsonb; effective_parameters jsonb; include_sources jsonb; exclude_sources jsonb; selected_sources jsonb; profile_body jsonb; authored_document jsonb; metadata jsonb; profile_code text; profile_title text; source_uri text; catalog_resource_id uuid; base_resource_id uuid; normalized_parameters jsonb; output_parameters jsonb; rationale_props jsonb;
  system_ids jsonb:='[]'; result jsonb; ordinal integer; value_ordinal integer; scope_rationale text; timestamp_now timestamptz:=now();
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then raise exception 'You cannot create a program in this workspace' using errcode='42501'; end if;
  if jsonb_typeof(p_draft) is distinct from 'object' or octet_length(p_draft::text)>2000000 then raise exception 'Invalid program wizard request' using errcode='23514'; end if;
  request_id:=(p_draft->>'requestId')::uuid;
  if request_id is null then raise exception 'The program request identifier is missing' using errcode='23514'; end if;
  payload_hash:=encode(extensions.digest(p_draft::text,'sha256'),'hex');
  perform pg_advisory_xact_lock(hashtextextended(p_tenant_id::text||'/program-wizard/'||request_id::text,0));
  select * into receipt from public.program_wizard_requests where tenant_id=p_tenant_id and id=request_id;
  if found then
    if receipt.created_by<>auth.uid() or receipt.payload_sha256<>payload_hash then raise exception 'This creation request was already used with different details. Reload the saved program before starting another request.' using errcode='PT409'; end if;
    return receipt.result;
  end if;
  select id into actor_id from public.parties where tenant_id=p_tenant_id and auth_user_id=auth.uid();
  if actor_id is null then raise exception 'Your workspace person record is missing' using errcode='23514'; end if;
  catalog_id:=(p_draft->>'catalogRevisionId')::uuid;
  select * into catalog_row from public.catalog_revisions where id=wizard.catalog_id and (tenant_id is null or tenant_id=p_tenant_id) and state='published' for share;
  select * into catalog_doc from public.oscal_document_revisions where id=catalog_row.document_revision_id and state='published' for share;
  if catalog_row.id is null or catalog_doc.id is null then raise exception 'Choose a published catalog revision' using errcode='23514'; end if;
  if jsonb_typeof(p_draft->'availableProfileResolutionIds') is distinct from 'array' or jsonb_array_length(p_draft->'availableProfileResolutionIds') not between 1 and 30
    or jsonb_typeof(p_draft->'systems') is distinct from 'array' or jsonb_array_length(p_draft->'systems') not between 1 and 50
    or jsonb_typeof(p_draft->'roles') is distinct from 'array' or jsonb_array_length(p_draft->'roles')>100 then raise exception 'Choose profiles and add at least one system' using errcode='23514'; end if;
  for value_item in select value from jsonb_array_elements(p_draft->'availableProfileResolutionIds') loop
    perform public.wizard_base_controls(p_tenant_id,catalog_id,(value_item#>>'{}')::uuid);
  end loop;
  if exists(select 1 from jsonb_array_elements(p_draft->'systems') s group by lower(btrim(s->>'code')) having count(*)>1)
    or exists(select 1 from jsonb_array_elements(p_draft->'systems') s group by s->>'key' having count(*)>1) then raise exception 'System codes and identifiers must be distinct' using errcode='23514'; end if;
  if nullif(p_draft->>'sponsorPartyId','') is not null and not exists(select 1 from public.parties where id=(p_draft->>'sponsorPartyId')::uuid and tenant_id=p_tenant_id) then raise exception 'Choose a sponsor in this workspace' using errcode='23514'; end if;
  insert into public.programs(id,tenant_id,code,name,description,sponsor_party_id,starts_on,ends_on)
    values(program_id,p_tenant_id,public.wizard_required_text(p_draft,'code'),public.wizard_required_text(p_draft,'name'),nullif(btrim(p_draft->>'description'),''),nullif(p_draft->>'sponsorPartyId','')::uuid,nullif(p_draft->>'startsOn','')::date,nullif(p_draft->>'endsOn','')::date);
  for role_item in select value from jsonb_array_elements(p_draft->'roles') loop
    insert into public.program_role_assignments(tenant_id,program_id,party_id,role) values(p_tenant_id,program_id,(role_item->>'partyId')::uuid,role_item->>'role');
  end loop;
  for chosen_resolution in select distinct (value#>>'{}')::uuid from jsonb_array_elements(p_draft->'availableProfileResolutionIds') loop
    insert into public.program_reference_choices(tenant_id,program_id,catalog_revision_id,profile_resolution_id) values(p_tenant_id,program_id,catalog_id,chosen_resolution);
  end loop;
  for system_item in select value from jsonb_array_elements(p_draft->'systems') loop
    perform public.wizard_required_text(system_item,'key')::uuid;
    if (system_item->>'confidentiality') is null or (system_item->>'integrity') is null or (system_item->>'availability') is null then raise exception 'Choose confidentiality, integrity, and availability for every system' using errcode='23514'; end if;
    if jsonb_typeof(system_item->'subsystems') is distinct from 'array' or jsonb_array_length(system_item->'subsystems')>300
      or jsonb_typeof(system_item->'tailoring') is distinct from 'array' or jsonb_array_length(system_item->'tailoring')>10000
      or jsonb_typeof(system_item->'parameters') is distinct from 'array' or jsonb_array_length(system_item->'parameters')>10000 then raise exception 'Invalid system composition or tailoring details' using errcode='23514'; end if;
    chosen_resolution:=(system_item->>'profileResolutionId')::uuid;
    if not (p_draft->'availableProfileResolutionIds') ? chosen_resolution::text then raise exception 'Choose a base profile selected for this program' using errcode='23514'; end if;
    base_ids:=public.wizard_base_controls(p_tenant_id,catalog_id,chosen_resolution);
    included_ids:=base_ids; excluded_ids:='{}'; seen_ids:='{}';
    for decision in select value from jsonb_array_elements(system_item->'tailoring') loop
      select * into control_row from public.controls where id=(decision->>'controlId')::uuid and catalog_revision_id=catalog_id;
      if control_row.id is null then raise exception 'Tailoring must select actual active controls from the chosen catalog' using errcode='23514'; end if;
      if control_row.id=any(seen_ids) then raise exception 'Record one tailoring decision per control' using errcode='23514'; end if;
      seen_ids:=array_append(seen_ids,control_row.id);
      perform public.wizard_required_text(decision,'rationale');
      if decision->>'action'='include' then
        if control_row.status<>'active' then raise exception 'Withdrawn controls cannot be newly included' using errcode='23514'; end if;
        if control_row.id=any(base_ids) then raise exception 'An included control is already selected by the base profile' using errcode='23514'; end if;
        included_ids:=array_append(included_ids,control_row.id);
      elsif decision->>'action'='exclude' then
        if not control_row.id=any(base_ids) then raise exception 'Exclude only controls selected by the base profile' using errcode='23514'; end if;
        excluded_ids:=array_append(excluded_ids,control_row.id);
      else raise exception 'Choose include or exclude for tailoring' using errcode='23514'; end if;
    end loop;
    select coalesce(array_agg(id order by public.wizard_control_order(source_id),id),'{}') into selected_ids from public.controls where id=any(included_ids) and not id=any(excluded_ids);
    if cardinality(selected_ids)=0 then raise exception 'A system baseline must retain at least one control' using errcode='23514'; end if;
    scope_rationale:=public.wizard_required_text(system_item,'categorizationRationale');
    system_id:=gen_random_uuid(); scope_id:=gen_random_uuid();
    insert into public.systems(id,tenant_id,program_id,code,name,description,system_type,system_owner_party_id,confidentiality_impact,integrity_impact,availability_impact,categorization_rationale)
      values(system_id,p_tenant_id,program_id,public.wizard_required_text(system_item,'code'),public.wizard_required_text(system_item,'name'),nullif(btrim(system_item->>'description'),''),system_item->>'type',nullif(system_item->>'ownerPartyId','')::uuid,system_item->>'confidentiality',system_item->>'integrity',system_item->>'availability',scope_rationale);
    insert into public.scopes(id,tenant_id,system_id,code,name,description,confidentiality_impact,integrity_impact,availability_impact,categorization_rationale)
      values(scope_id,p_tenant_id,system_id,public.wizard_required_text(system_item,'code'),public.wizard_required_text(system_item,'name'),nullif(btrim(system_item->>'description'),''),system_item->>'confidentiality',system_item->>'integrity',system_item->>'availability',scope_rationale);
    if exists(select 1 from jsonb_array_elements(system_item->'subsystems') n group by n->>'key' having count(*)>1)
      or exists(select 1 from jsonb_array_elements(system_item->'subsystems') n group by lower(btrim(n->>'code')) having count(*)>1) then raise exception 'Subsystem codes and identifiers must be distinct' using errcode='23514'; end if;
    node_map:='{}'; nodes_left:=jsonb_array_length(system_item->'subsystems');
    while nodes_left>0 loop
      made_progress:=false;
      for node_item in select value from jsonb_array_elements(system_item->'subsystems') loop
        perform public.wizard_required_text(node_item,'key')::uuid;
        if node_map ? (node_item->>'key') then continue; end if;
        if nullif(node_item->>'parentKey','') is not null and not node_map ? (node_item->>'parentKey') then continue; end if;
        parent_id:=(node_map->>(node_item->>'parentKey'))::uuid;
        selected_id:=gen_random_uuid();
        insert into public.composition_nodes(id,tenant_id,system_id,parent_id,code,name,description,node_type)
          values(selected_id,p_tenant_id,system_id,parent_id,public.wizard_required_text(node_item,'code'),public.wizard_required_text(node_item,'name'),nullif(btrim(node_item->>'description'),''),node_item->>'type');
        node_map:=node_map||jsonb_build_object(node_item->>'key',selected_id); nodes_left:=nodes_left-1; made_progress:=true;
      end loop;
      if not made_progress then raise exception 'Choose subsystem parents within the same system without cycles' using errcode='23514'; end if;
    end loop;

    select * into base_resolution from public.profile_resolutions where id=chosen_resolution;
    select * into base_profile from public.profile_revisions where id=base_resolution.profile_revision_id;
    select * into base_doc from public.oscal_document_revisions where id=base_profile.document_revision_id;
    effective_parameters:='{}';
    -- Catalog defaults and the published base profile's explicit settings are
    -- retained only for parameters relevant to this resolved control selection.
    for parameter_row in select * from public.parameters where catalog_revision_id=catalog_id and control_id=any(selected_ids) loop
      select jsonb_agg(value order by ordinal) into parameter_values_json from public.parameter_values where parameter_id=parameter_row.id;
      if parameter_values_json is not null then effective_parameters:=effective_parameters||jsonb_build_object(parameter_row.id::text,jsonb_build_object('values',parameter_values_json,'rationale',null,'origin','catalog')); end if;
    end loop;
    for setting_row in select s.*,p.id as catalog_parameter_id from public.profile_parameter_settings s join public.parameters p on p.catalog_revision_id=catalog_id and p.source_id=s.parameter_source_id where s.profile_revision_id=base_profile.id and p.control_id=any(selected_ids) loop
      select jsonb_agg(value order by ordinal) into parameter_values_json from public.profile_parameter_values where setting_id=setting_row.id;
      if parameter_values_json is not null then effective_parameters:=effective_parameters||jsonb_build_object(setting_row.catalog_parameter_id::text,jsonb_build_object('values',parameter_values_json,'rationale',setting_row.rationale,'origin','profile')); end if;
    end loop;
    seen_ids:='{}';
    for parameter_item in select value from jsonb_array_elements(system_item->'parameters') loop
      select * into parameter_row from public.parameters where id=(parameter_item->>'parameterId')::uuid and catalog_revision_id=catalog_id and control_id=any(selected_ids);
      if parameter_row.id is null then raise exception 'Set parameters only for selected controls in this catalog' using errcode='23514'; end if;
      if parameter_row.id=any(seen_ids) then raise exception 'Record one value set per parameter' using errcode='23514'; end if;
      seen_ids:=array_append(seen_ids,parameter_row.id);
      perform public.wizard_required_text(parameter_item,'rationale');
      if jsonb_typeof(parameter_item->'values') is distinct from 'array' or jsonb_array_length(parameter_item->'values') not between 1 and 100 then raise exception 'Enter at least one parameter value' using errcode='23514'; end if;
      if exists(select 1 from jsonb_array_elements(parameter_item->'values') v where jsonb_typeof(v)<>'string') then raise exception 'Parameter values must be text' using errcode='23514'; end if;
      select jsonb_agg(btrim(v.value#>>'{}') order by v.ordinality) into parameter_values_json from jsonb_array_elements(parameter_item->'values') with ordinality v(value,ordinality);
      parameter_item:=jsonb_set(parameter_item,'{values}',parameter_values_json);
      for value_item in select value from jsonb_array_elements(parameter_item->'values') loop
        if jsonb_typeof(value_item)<>'string' or length(btrim(value_item#>>'{}'))=0 or length(value_item#>>'{}')>10000 then raise exception 'Parameter values cannot be empty' using errcode='23514'; end if;
        if parameter_row.has_selection and exists(select 1 from public.parameter_choices where parameter_id=parameter_row.id) and not exists(select 1 from public.parameter_choices where parameter_id=parameter_row.id and value ~ '(\{\{|<[^>]+>)')
          and not exists(select 1 from public.parameter_choices where parameter_id=parameter_row.id and value=value_item#>>'{}') then raise exception 'Choose a published option for this selection parameter' using errcode='23514'; end if;
      end loop;
      if coalesce(parameter_row.selection_count,'one')='one' and parameter_row.has_selection and jsonb_array_length(parameter_item->'values')<>1 then raise exception 'This parameter requires exactly one selected value' using errcode='23514'; end if;
      effective_parameters:=effective_parameters||jsonb_build_object(parameter_row.id::text,jsonb_build_object('values',parameter_item->'values','rationale',btrim(parameter_item->>'rationale'),'origin','override'));
    end loop;


    for setting_row in select e.key,e.value from jsonb_each(effective_parameters) e loop
      select * into parameter_row from public.parameters where id=setting_row.key::uuid;
      if parameter_row.has_selection and coalesce(parameter_row.selection_count,'one')='one' and jsonb_array_length(setting_row.value->'values')<>1 then raise exception 'An inherited selection parameter requires exactly one value' using errcode='23514'; end if;
      if parameter_row.has_selection and exists(select 1 from public.parameter_choices where parameter_id=parameter_row.id) and not exists(select 1 from public.parameter_choices where parameter_id=parameter_row.id and value ~ '(\{\{|<[^>]+>)')
        and exists(select 1 from jsonb_array_elements_text(setting_row.value->'values') v where not exists(select 1 from public.parameter_choices c where c.parameter_id=parameter_row.id and c.value=v.value)) then raise exception 'An inherited parameter value does not match a published selection option' using errcode='23514'; end if;
    end loop;

    document_id:=gen_random_uuid(); document_revision_id:=gen_random_uuid(); profile_id:=gen_random_uuid(); profile_revision_id:=gen_random_uuid(); resolution_id:=gen_random_uuid();
    profile_code:=public.wizard_required_text(p_draft,'code')||'/'||public.wizard_required_text(system_item,'code')||'/baseline';
    profile_title:=public.wizard_required_text(system_item,'name')||' — draft tailored baseline';
    catalog_resource_id:=gen_random_uuid(); base_resource_id:=gen_random_uuid();
    source_uri:='urn:uuid:'||catalog_doc.id::text;
    select jsonb_agg(source_id order by public.wizard_control_order(source_id),id) into include_sources from public.controls where id=any(included_ids);
    select jsonb_agg(source_id order by public.wizard_control_order(source_id),id) into selected_sources from public.controls where id=any(selected_ids);
    select coalesce(jsonb_agg(jsonb_build_object('with-child-controls','no','with-ids',jsonb_build_array(c.source_id)) order by item.ordinality),'[]') into exclude_sources
      from jsonb_array_elements(system_item->'tailoring') with ordinality item(value,ordinality) join public.controls c on c.id=(item.value->>'controlId')::uuid where item.value->>'action'='exclude';
    select coalesce(jsonb_agg(jsonb_build_object('name','control-'||(item.value->>'action')||'-rationale','ns','urn:program-assurance:profile-authoring','class',c.source_id,'value',btrim(item.value->>'rationale')) order by item.ordinality),'[]') into rationale_props
      from jsonb_array_elements(system_item->'tailoring') with ordinality item(value,ordinality) join public.controls c on c.id=(item.value->>'controlId')::uuid;
    select rationale_props||coalesce(jsonb_agg(jsonb_build_object('name','parameter-rationale','ns','urn:program-assurance:profile-authoring','class',p.source_id,'value',e.value->>'rationale') order by public.wizard_control_order(p.source_id)),'[]') into rationale_props
      from jsonb_each(effective_parameters) e join public.parameters p on p.id=e.key::uuid where e.value->>'origin'<>'catalog' and nullif(e.value->>'rationale','') is not null;
    metadata:=jsonb_build_object('title',profile_title,'last-modified',to_char(timestamp_now at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'version','1','oscal-version',catalog_doc.oscal_version,
      'links',jsonb_build_array(jsonb_build_object('href','#'||base_resource_id::text,'rel','derived-from')),
      'props',jsonb_build_array(jsonb_build_object('name','base-resolution-id','ns','urn:program-assurance:profile-authoring','value',chosen_resolution))||rationale_props,
      'remarks',scope_rationale);
    profile_body:=jsonb_build_object('uuid',profile_revision_id,'metadata',metadata,'imports',jsonb_build_array(jsonb_build_object('href','#'||catalog_resource_id::text,'include-controls',jsonb_build_array(jsonb_build_object('with-child-controls','no','with-ids',include_sources)))),'merge',jsonb_build_object('as-is',true),
      'back-matter',jsonb_build_object('resources',jsonb_build_array(
        jsonb_build_object('uuid',catalog_resource_id,'title',catalog_row.title,'props',jsonb_build_array(jsonb_build_object('name','document-revision-id','ns','urn:program-assurance:profile-authoring','value',catalog_doc.id)),
          'rlinks',jsonb_build_array(jsonb_build_object('href',source_uri,'media-type','application/oscal.catalog+json','hashes',jsonb_build_array(jsonb_build_object('algorithm','SHA-256','value',catalog_doc.content_sha256))))),
        jsonb_build_object('uuid',base_resource_id,'title',base_profile.title,'props',jsonb_build_array(jsonb_build_object('name','document-revision-id','ns','urn:program-assurance:profile-authoring','value',base_doc.id)),
          'rlinks',jsonb_build_array(jsonb_build_object('href','urn:uuid:'||base_doc.id::text,'media-type','application/oscal.profile+json','hashes',jsonb_build_array(jsonb_build_object('algorithm','SHA-256','value',base_doc.content_sha256)))))
      )));
    if jsonb_array_length(exclude_sources)>0 then profile_body:=jsonb_set(profile_body,'{imports,0,exclude-controls}',exclude_sources); end if;
    select coalesce(jsonb_agg(jsonb_build_object('param-id',p.source_id,'values',e.value->'values') order by public.wizard_control_order(p.source_id)),'[]') into normalized_parameters
      from jsonb_each(effective_parameters) e join public.parameters p on p.id=e.key::uuid where e.value->>'origin'<>'catalog';
    select coalesce(jsonb_object_agg(p.source_id,e.value->'values'),'{}') into output_parameters from jsonb_each(effective_parameters) e join public.parameters p on p.id=e.key::uuid;
    if jsonb_array_length(normalized_parameters)>0 then profile_body:=profile_body||jsonb_build_object('modify',jsonb_build_object('set-parameters',normalized_parameters)); end if;
    authored_document:=jsonb_build_object('profile',profile_body);
    insert into public.oscal_documents(id,tenant_id,model,title,code) values(document_id,p_tenant_id,'profile',profile_title,profile_code);
    insert into public.oscal_document_revisions(id,tenant_id,document_id,source_uuid,document_version,oscal_version,title,last_modified,content_sha256,original_content,metadata)
      values(document_revision_id,p_tenant_id,document_id,profile_revision_id,'1',catalog_doc.oscal_version,profile_title,timestamp_now,encode(extensions.digest(authored_document::text,'sha256'),'hex'),authored_document,metadata);
    insert into public.profiles(id,tenant_id,code,title) values(profile_id,p_tenant_id,profile_code,profile_title);
    insert into public.profile_revisions(id,tenant_id,profile_id,document_revision_id,version,title) values(profile_revision_id,p_tenant_id,profile_id,document_revision_id,'1',profile_title);
    insert into public.oscal_document_imports(tenant_id,document_revision_id,referenced_revision_id,href,resolved_uri,resolution_status,ordinal)
      values(p_tenant_id,document_revision_id,catalog_doc.id,'#'||catalog_resource_id::text,source_uri,'resolved',0) returning id into document_import_id;
    insert into public.profile_imports(tenant_id,profile_revision_id,catalog_revision_id,document_import_id,href,ordinal)
      values(p_tenant_id,profile_revision_id,catalog_id,document_import_id,'#'||catalog_resource_id::text,0) returning id into import_id;
    insert into public.profile_rules(tenant_id,profile_revision_id,profile_import_id,kind,ordinal,source_pointer,definition,rationale)
      values(p_tenant_id,profile_revision_id,import_id,'include',0,'/profile/imports/0/include-controls/0',jsonb_build_object('with-child-controls','no','with-ids',include_sources),null) returning id into include_rule_id;
    insert into public.profile_rules(tenant_id,profile_revision_id,kind,ordinal,source_pointer,definition) values(p_tenant_id,profile_revision_id,'merge',0,'/profile/merge','{"as-is":true}');
    ordinal:=0;
    for decision in select value from jsonb_array_elements(system_item->'tailoring') where value->>'action'='exclude' loop
      select * into control_row from public.controls where id=(decision->>'controlId')::uuid;
      insert into public.profile_rules(tenant_id,profile_revision_id,profile_import_id,kind,ordinal,source_pointer,definition,rationale)
        values(p_tenant_id,profile_revision_id,import_id,'exclude',ordinal,'/profile/imports/0/exclude-controls/'||ordinal,jsonb_build_object('with-child-controls','no','with-ids',jsonb_build_array(control_row.source_id)),btrim(decision->>'rationale'));
      ordinal:=ordinal+1;
    end loop;
    ordinal:=0;
    for setting_row in select e.key,e.value,p.source_id from jsonb_each(effective_parameters) e join public.parameters p on p.id=e.key::uuid where e.value->>'origin'<>'catalog' order by public.wizard_control_order(p.source_id) loop
      insert into public.profile_parameter_settings(tenant_id,profile_revision_id,parameter_id,parameter_source_id,rationale) values(p_tenant_id,profile_revision_id,setting_row.key::uuid,setting_row.source_id,setting_row.value->>'rationale') returning id into setting_id;
      insert into public.profile_parameter_values(tenant_id,setting_id,ordinal,value) select p_tenant_id,setting_id,(v.ordinality-1)::integer,v.value#>>'{}' from jsonb_array_elements(setting_row.value->'values') with ordinality v(value,ordinality);
      insert into public.profile_rules(tenant_id,profile_revision_id,kind,ordinal,source_pointer,definition,rationale)
        values(p_tenant_id,profile_revision_id,'set-parameter',ordinal,'/profile/modify/set-parameters/'||ordinal,jsonb_build_object('param-id',setting_row.source_id,'values',setting_row.value->'values'),setting_row.value->>'rationale');
      ordinal:=ordinal+1;
    end loop;
    insert into public.oscal_document_resources(tenant_id,document_revision_id,source_uuid,title,source_content)
      select p_tenant_id,document_revision_id,(resource->>'uuid')::uuid,resource->>'title',resource from jsonb_array_elements(profile_body->'back-matter'->'resources') resource;
    insert into public.profile_resolutions(id,tenant_id,profile_revision_id,resolver_name,resolver_version,input_sha256,output_sha256,resolved_at)
      values(resolution_id,p_tenant_id,profile_revision_id,'program-assurance-explicit-profile','1',encode(extensions.digest(jsonb_build_object('baseResolutionId',chosen_resolution,'baseInputHash',base_resolution.input_sha256,'baseOutputHash',base_resolution.output_sha256,'catalogHash',catalog_doc.content_sha256,'decisions',system_item->'tailoring','parameters',effective_parameters,'authoredDocumentHash',encode(extensions.digest(authored_document::text,'sha256'),'hex'))::text,'sha256'),'hex'),encode(extensions.digest(jsonb_build_object('controls',selected_sources,'parameters',output_parameters)::text,'sha256'),'hex'),timestamp_now);
    insert into public.profile_resolution_inputs(tenant_id,profile_resolution_id,document_revision_id,ordinal) values(p_tenant_id,resolution_id,document_revision_id,0);
    ordinal:=1;
    for input_row in select distinct id from (select catalog_doc.id union select base_doc.id union select i.document_revision_id from public.profile_resolution_inputs i where i.profile_resolution_id=chosen_resolution) inputs(id) order by id loop
      insert into public.profile_resolution_inputs(tenant_id,profile_resolution_id,document_revision_id,ordinal) values(p_tenant_id,resolution_id,input_row.id,ordinal); ordinal:=ordinal+1;
    end loop;
    ordinal:=0;
    for control_row in select * from public.controls where id=any(selected_ids) order by public.wizard_control_order(source_id),id loop
      insert into public.selected_controls(tenant_id,profile_resolution_id,control_id,ordinal) values(p_tenant_id,resolution_id,control_row.id,ordinal) returning id into selected_id;
      select value into decision from jsonb_array_elements(system_item->'tailoring') where value->>'controlId'=control_row.id::text;
      insert into public.selection_provenance(tenant_id,selected_control_id,profile_import_id,profile_rule_id,source_pointer,rationale)
        values(p_tenant_id,selected_id,import_id,include_rule_id,'/profile/imports/0/include-controls/0/with-ids/'||((select ordinality-1 from jsonb_array_elements_text(include_sources) with ordinality included(value,ordinality) where included.value=control_row.source_id)),coalesce(decision->>'rationale','Retained from explicitly chosen base profile resolution '||chosen_resolution::text));
      ordinal:=ordinal+1;
    end loop;
    insert into public.scope_baselines(tenant_id,scope_id,profile_resolution_id,adopted_at,adopted_by_party_id,rationale)
      values(p_tenant_id,scope_id,resolution_id,timestamp_now,actor_id,'Draft baseline selected during program creation. '||scope_rationale);
    insert into public.ssp_revisions(tenant_id,system_id,profile_resolution_id,version_number,description) values(p_tenant_id,system_id,resolution_id,1,'Draft SSP initialized from the explicitly selected and tailored control baseline.') returning id into ssp_id;
    insert into public.implemented_requirements(tenant_id,ssp_revision_id,selected_control_id) select p_tenant_id,ssp_id,id from public.selected_controls where profile_resolution_id=resolution_id;
    system_ids:=system_ids||jsonb_build_array(system_id);
  end loop;
  result:=jsonb_build_object('programId',program_id,'systemIds',system_ids);
  insert into public.program_wizard_requests(id,tenant_id,program_id,payload_sha256,result,created_by) values(request_id,p_tenant_id,program_id,payload_hash,result,auth.uid());
  return result;
end;
$$;
revoke all on function public.create_program_wizard(uuid,jsonb) from public,anon;
grant execute on function public.create_program_wizard(uuid,jsonb) to authenticated;
