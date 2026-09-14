-- An explicit system adoption overrides inherited control selection. Existing SSP
-- baseline pins remain historical document context and are never rewritten here.
alter table public.systems add column adopted_profile_resolution_id uuid references public.profile_resolutions(id),
  add column baseline_rationale text;
select public.attach_reference_tenant_guard('systems','adopted_profile_resolution_id','profile_resolutions');
comment on column public.systems.adopted_profile_resolution_id is 'Explicit control baseline for this system. NULL inherits the nearest containing system inside this authorization boundary.';

create view public.system_effective_baselines with (security_invoker=true) as
with recursive ancestry as (
  select s.id as system_id,s.tenant_id,s.boundary_system_id,s.id as ancestor_id,s.parent_system_id,s.adopted_profile_resolution_id,0 as distance
  from public.systems s
  union all
  select a.system_id,a.tenant_id,a.boundary_system_id,p.id,p.parent_system_id,p.adopted_profile_resolution_id,a.distance+1
  from ancestry a join public.systems p on p.tenant_id=a.tenant_id and p.id=a.parent_system_id and p.boundary_system_id=a.boundary_system_id
), explicit_adoptions as (
  select distinct on (tenant_id,system_id) tenant_id,system_id,ancestor_id,adopted_profile_resolution_id
  from ancestry where adopted_profile_resolution_id is not null order by tenant_id,system_id,distance
)
select s.id,s.id as system_id,s.tenant_id,s.boundary_system_id,
  coalesce(e.adopted_profile_resolution_id,plan.profile_resolution_id,scope_base.profile_resolution_id) as profile_resolution_id,
  case when e.ancestor_id is not null then e.ancestor_id
    when plan.profile_resolution_id is not null or scope_base.profile_resolution_id is not null then s.boundary_system_id end as source_system_id,
  case when e.ancestor_id is not null then e.ancestor_id<>s.id
    else s.id<>s.boundary_system_id and (plan.profile_resolution_id is not null or scope_base.profile_resolution_id is not null) end as inherited,
  case when e.ancestor_id=s.id then 'Explicit system adoption'
    when e.ancestor_id is not null then 'Inherited system adoption'
    when plan.profile_resolution_id is not null then 'Authorization boundary SSP'
    when scope_base.profile_resolution_id is not null then 'Authorization boundary scope adoption'
    when scope_base.conflicting then 'Conflicting authorization boundary scope adoptions'
    else 'No baseline recorded' end as source_label
from public.systems s
left join explicit_adoptions e on e.tenant_id=s.tenant_id and e.system_id=s.id
left join lateral (
  select p.profile_resolution_id from public.ssp_revisions p
  where p.tenant_id=s.tenant_id and p.system_id=s.boundary_system_id order by p.version_number desc limit 1
) plan on true
left join lateral (
  select case when count(distinct candidates.profile_resolution_id)=1 then min(candidates.profile_resolution_id::text)::uuid end as profile_resolution_id,
    count(distinct candidates.profile_resolution_id)>1 as conflicting
  from (
    select b.profile_resolution_id,rank() over (order by b.adopted_at desc) as position
    from public.scope_baselines b join public.scopes sc on sc.tenant_id=b.tenant_id and sc.id=b.scope_id
    where sc.tenant_id=s.tenant_id and sc.system_id=s.boundary_system_id and sc.composition_node_id is null
  ) candidates where position=1
) scope_base on true;
grant select on public.system_effective_baselines to authenticated;
revoke all on public.system_effective_baselines from public,anon;

create table public.system_baseline_requests (
  id uuid primary key, tenant_id uuid not null references public.tenants(id),system_id uuid not null,
  payload_sha256 text not null check (payload_sha256 ~ '^[a-f0-9]{64}$'),result jsonb not null,
  created_by uuid not null references auth.users(id),created_at timestamptz not null default now(),
  foreign key (tenant_id,system_id) references public.systems(tenant_id,id)
);
alter table public.system_baseline_requests enable row level security;
revoke all on public.system_baseline_requests from public,anon,authenticated;
grant select on public.system_baseline_requests to authenticated;
create policy system_baseline_request_read on public.system_baseline_requests for select to authenticated using (public.can_read_tenant(tenant_id));

create function public.adopt_system_baseline(p_tenant_id uuid,p_system_id uuid,p_expected_revision integer,p_request_id uuid,p_selection jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
#variable_conflict use_column
<<baseline>>
declare
  target public.systems; receipt public.system_baseline_requests; payload_hash text; result jsonb;
  catalog_id uuid; chosen_resolution uuid; base_ids uuid[]; selected_ids uuid[]; included_ids uuid[]; excluded_ids uuid[];
  catalog_row public.catalog_revisions; catalog_doc public.oscal_document_revisions;
  base_resolution public.profile_resolutions; base_profile public.profile_revisions; base_doc public.oscal_document_revisions;
  document_id uuid; document_revision_id uuid; profile_id uuid; profile_revision_id uuid; resolution_id uuid;
  import_id uuid; document_import_id uuid; include_rule_id uuid; selected_id uuid; setting_id uuid;
  catalog_resource_id uuid; base_resource_id uuid; profile_code text; profile_title text; source_uri text;
  effective_parameters jsonb:='{}'; parameter_values_json jsonb; normalized_parameters jsonb; output_parameters jsonb;
  include_sources jsonb; selected_sources jsonb; exclude_sources jsonb; rationale_props jsonb;
  metadata jsonb; profile_body jsonb; authored_document jsonb; decisions jsonb; decision jsonb;
  control_row public.controls; parameter_row public.parameters; setting_row record; input_row record;
  ordinal integer; timestamp_now timestamptz:=now(); rationale text; program_uuid uuid;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then raise exception 'Workspace write access is required' using errcode='42501'; end if;
  if p_request_id is null or jsonb_typeof(p_selection) is distinct from 'object' then raise exception 'Enter a baseline selection' using errcode='23514'; end if;
  select program_id into program_uuid from public.systems where tenant_id=p_tenant_id and id=p_system_id;
  if program_uuid is null then raise exception 'System was not found in this workspace' using errcode='23514'; end if;
  perform 1 from public.programs where tenant_id=p_tenant_id and id=program_uuid for no key update;
  select * into target from public.systems where tenant_id=p_tenant_id and id=p_system_id for update;
  payload_hash:=encode(extensions.digest(jsonb_build_object('systemId',p_system_id,'revision',p_expected_revision,'selection',p_selection)::text,'sha256'),'hex');
  select * into receipt from public.system_baseline_requests where id=p_request_id;
  if found then
    if receipt.tenant_id<>p_tenant_id or receipt.system_id<>p_system_id or receipt.payload_sha256<>payload_hash then raise exception 'This save request has already been used for different changes' using errcode='PT409'; end if;
    return receipt.result;
  end if;
  if target.revision is distinct from p_expected_revision then raise exception 'The system changed; reload before changing its baseline' using errcode='PT409'; end if;
  if p_selection->>'mode'='inherit' then
    resolution_id:=null; rationale:=null;
  elsif p_selection->>'mode'='adopt' then
    catalog_id:=(p_selection->>'catalogRevisionId')::uuid;
    chosen_resolution:=(p_selection->>'profileResolutionId')::uuid;
    base_ids:=public.wizard_base_controls(p_tenant_id,catalog_id,chosen_resolution);
    if jsonb_typeof(p_selection->'controlIds') is distinct from 'array' then raise exception 'Choose the controls for this baseline' using errcode='23514'; end if;
    select coalesce(array_agg(distinct value::uuid order by value::uuid),'{}') into selected_ids from jsonb_array_elements_text(p_selection->'controlIds');
    if cardinality(selected_ids)=0 or exists(select 1 from unnest(selected_ids) picked(id) where not exists(select 1 from public.controls c where c.id=picked.id and c.catalog_revision_id=catalog_id and (c.tenant_id is null or c.tenant_id=p_tenant_id))) then raise exception 'Choose at least one control from the selected catalog' using errcode='23514'; end if;
    rationale:=nullif(btrim(p_selection->>'rationale'),'');
    if selected_ids is not distinct from base_ids then resolution_id:=chosen_resolution;
    else
      if rationale is null or length(rationale)>10000 then raise exception 'Record why this baseline is tailored' using errcode='23514'; end if;
      select coalesce(array_agg(distinct id order by id),'{}') into included_ids from unnest(base_ids||selected_ids) id;
      select coalesce(array_agg(id order by id),'{}') into excluded_ids from unnest(base_ids) id where not id=any(selected_ids);
      select coalesce(jsonb_agg(jsonb_build_object('controlId',id,'action',case when id=any(base_ids) then 'exclude' else 'include' end,'rationale',rationale) order by id),'[]') into decisions
        from unnest(included_ids) id where (id=any(base_ids)) is distinct from (id=any(selected_ids));
      select * into catalog_row from public.catalog_revisions where id=baseline.catalog_id;
      select * into catalog_doc from public.oscal_document_revisions where id=catalog_row.document_revision_id;
      select * into base_resolution from public.profile_resolutions where id=chosen_resolution;
      select * into base_profile from public.profile_revisions where id=base_resolution.profile_revision_id;
      select * into base_doc from public.oscal_document_revisions where id=base_profile.document_revision_id;
      for parameter_row in select * from public.parameters where catalog_revision_id=catalog_id and control_id=any(selected_ids) loop
        select jsonb_agg(value order by ordinal) into parameter_values_json from public.parameter_values where parameter_id=parameter_row.id;
        if parameter_values_json is not null then effective_parameters:=effective_parameters||jsonb_build_object(parameter_row.id::text,jsonb_build_object('values',parameter_values_json,'rationale',null,'origin','catalog')); end if;
      end loop;
      for setting_row in select s.*,p.id as catalog_parameter_id from public.profile_parameter_settings s join public.parameters p on p.catalog_revision_id=catalog_id and p.source_id=s.parameter_source_id where s.profile_revision_id=base_profile.id and p.control_id=any(selected_ids) loop
        select jsonb_agg(value order by ordinal) into parameter_values_json from public.profile_parameter_values where setting_id=setting_row.id;
        if parameter_values_json is not null then effective_parameters:=effective_parameters||jsonb_build_object(setting_row.catalog_parameter_id::text,jsonb_build_object('values',parameter_values_json,'rationale',setting_row.rationale,'origin','profile')); end if;
      end loop;
    document_id:=gen_random_uuid(); document_revision_id:=gen_random_uuid(); profile_id:=gen_random_uuid(); profile_revision_id:=gen_random_uuid(); resolution_id:=gen_random_uuid();
    profile_code:='system/'||target.id::text||'/baseline/'||p_request_id::text;
    profile_title:=target.name||' — tailored baseline';
    catalog_resource_id:=gen_random_uuid(); base_resource_id:=gen_random_uuid();
    source_uri:='urn:uuid:'||catalog_doc.id::text;
    select jsonb_agg(source_id order by public.wizard_control_order(source_id),id) into include_sources from public.controls where id=any(included_ids);
    select jsonb_agg(source_id order by public.wizard_control_order(source_id),id) into selected_sources from public.controls where id=any(selected_ids);
    select coalesce(jsonb_agg(jsonb_build_object('with-child-controls','no','with-ids',jsonb_build_array(c.source_id)) order by item.ordinality),'[]') into exclude_sources
      from jsonb_array_elements(decisions) with ordinality item(value,ordinality) join public.controls c on c.id=(item.value->>'controlId')::uuid where item.value->>'action'='exclude';
    select coalesce(jsonb_agg(jsonb_build_object('name','control-'||(item.value->>'action')||'-rationale','ns','urn:program-assurance:profile-authoring','class',c.source_id,'value',btrim(item.value->>'rationale')) order by item.ordinality),'[]') into rationale_props
      from jsonb_array_elements(decisions) with ordinality item(value,ordinality) join public.controls c on c.id=(item.value->>'controlId')::uuid;
    select rationale_props||coalesce(jsonb_agg(jsonb_build_object('name','parameter-rationale','ns','urn:program-assurance:profile-authoring','class',p.source_id,'value',e.value->>'rationale') order by public.wizard_control_order(p.source_id)),'[]') into rationale_props
      from jsonb_each(effective_parameters) e join public.parameters p on p.id=e.key::uuid where e.value->>'origin'<>'catalog' and nullif(e.value->>'rationale','') is not null;
    metadata:=jsonb_build_object('title',profile_title,'last-modified',to_char(timestamp_now at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'version','1','oscal-version',catalog_doc.oscal_version,
      'links',jsonb_build_array(jsonb_build_object('href','#'||base_resource_id::text,'rel','derived-from')),
      'props',jsonb_build_array(jsonb_build_object('name','base-resolution-id','ns','urn:program-assurance:profile-authoring','value',chosen_resolution))||rationale_props,
      'remarks',rationale);
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
    for decision in select value from jsonb_array_elements(decisions) where value->>'action'='exclude' loop
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
      values(resolution_id,p_tenant_id,profile_revision_id,'program-assurance-explicit-profile','1',encode(extensions.digest(jsonb_build_object('baseResolutionId',chosen_resolution,'baseInputHash',base_resolution.input_sha256,'baseOutputHash',base_resolution.output_sha256,'catalogHash',catalog_doc.content_sha256,'decisions',decisions,'parameters',effective_parameters,'authoredDocumentHash',encode(extensions.digest(authored_document::text,'sha256'),'hex'))::text,'sha256'),'hex'),encode(extensions.digest(jsonb_build_object('controls',selected_sources,'parameters',output_parameters)::text,'sha256'),'hex'),timestamp_now);
    insert into public.profile_resolution_inputs(tenant_id,profile_resolution_id,document_revision_id,ordinal) values(p_tenant_id,resolution_id,document_revision_id,0);
    ordinal:=1;
    for input_row in select distinct id from (select catalog_doc.id union select base_doc.id union select i.document_revision_id from public.profile_resolution_inputs i where i.profile_resolution_id=chosen_resolution) inputs(id) order by id loop
      insert into public.profile_resolution_inputs(tenant_id,profile_resolution_id,document_revision_id,ordinal) values(p_tenant_id,resolution_id,input_row.id,ordinal); ordinal:=ordinal+1;
    end loop;
    ordinal:=0;
    for control_row in select * from public.controls where id=any(selected_ids) order by public.wizard_control_order(source_id),id loop
      insert into public.selected_controls(tenant_id,profile_resolution_id,control_id,ordinal) values(p_tenant_id,resolution_id,control_row.id,ordinal) returning id into selected_id;
      select value into decision from jsonb_array_elements(decisions) where value->>'controlId'=control_row.id::text;
      insert into public.selection_provenance(tenant_id,selected_control_id,profile_import_id,profile_rule_id,source_pointer,rationale)
        values(p_tenant_id,selected_id,import_id,include_rule_id,'/profile/imports/0/include-controls/0/with-ids/'||((select ordinality-1 from jsonb_array_elements_text(include_sources) with ordinality included(value,ordinality) where included.value=control_row.source_id)),coalesce(decision->>'rationale','Retained from explicitly chosen base profile resolution '||chosen_resolution::text));
      ordinal:=ordinal+1;
    end loop;
    end if;
  else raise exception 'Choose adoption or inheritance' using errcode='23514'; end if;
  if target.adopted_profile_resolution_id is distinct from resolution_id or target.baseline_rationale is distinct from rationale then
    update public.systems set adopted_profile_resolution_id=resolution_id,baseline_rationale=rationale,revision=p_expected_revision+1
      where tenant_id=p_tenant_id and id=p_system_id returning * into target;
  end if;
  result:=jsonb_build_object('systemId',target.id,'profileResolutionId',target.adopted_profile_resolution_id,'revision',target.revision);
  insert into public.system_baseline_requests(id,tenant_id,system_id,payload_sha256,result,created_by)
    values(p_request_id,p_tenant_id,p_system_id,payload_hash,result,auth.uid());
  return result;
end; $$;
revoke all on function public.adopt_system_baseline(uuid,uuid,integer,uuid,jsonb) from public,anon;
grant execute on function public.adopt_system_baseline(uuid,uuid,integer,uuid,jsonb) to authenticated;
-- Baseline authoring is one validated command; generic record edits cannot point
-- a system at an arbitrary, partially authored draft resolution.
create function public.guard_system_baseline_command() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if current_user in ('authenticated','anon') and
    (tg_op='INSERT' and (new.adopted_profile_resolution_id is not null or new.baseline_rationale is not null)
     or tg_op='UPDATE' and (new.adopted_profile_resolution_id is distinct from old.adopted_profile_resolution_id or new.baseline_rationale is distinct from old.baseline_rationale)) then
    raise exception 'Use the system baseline dialog to validate and adopt this control selection' using errcode='23514';
  end if;
  return new;
end; $$;
revoke all on function public.guard_system_baseline_command() from public,anon,authenticated;
create trigger a_system_baseline_command before insert or update of adopted_profile_resolution_id,baseline_rationale
  on public.systems for each row execute function public.guard_system_baseline_command();
comment on function public.adopt_system_baseline(uuid,uuid,integer,uuid,jsonb) is 'Atomically adopt a published resolved profile, or author a draft exact-ID OSCAL profile for intentional control additions/removals and adopt it. Same request retries reconcile; system CAS prevents lost updates. Does not publish or rewrite SSP history.';

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
      or (c.relkind='v' and c.relname in ('composition_nodes','system_component_element_links','system_effective_baselines')))
      and c.relname not in ('workspace_snapshots','spatial_ref_sys','tenants','tenant_memberships')
      and pg_catalog.has_table_privilege('authenticated',c.oid,'SELECT')
      and exists(select 1 from pg_catalog.pg_attribute a where a.attrelid=c.oid and a.attname='id' and not a.attisdropped)
  ) tables;
  return result;
end; $$;
revoke all on function public.app_schema() from public,anon;
grant execute on function public.app_schema() to authenticated;
