-- Serialize each storage write with exact citation capture on the same version row.
-- Capture holds FOR SHARE; an object mutation must wait for it and then re-check
-- committed citations before it can write. Publication already locks this row too.
create or replace function public.can_access_evidence_object(object_name text, writing boolean default false) returns boolean
language plpgsql security definer set search_path = '' as $$
declare owner_tenant uuid; version_state text;
begin
  if writing then
    select tenant_id,state into owner_tenant,version_state from public.evidence_versions
      where storage_object_name=object_name for update;
    if owner_tenant is null then return false; end if;
    return version_state='draft' and public.can_write_tenant(owner_tenant)
      and not exists(select 1 from public.assurance_citations c where c.source_storage_object_name=object_name);
  end if;
  return exists(select 1 from public.evidence_versions v where v.storage_object_name=object_name and public.can_read_tenant(v.tenant_id))
    or exists(select 1 from public.assurance_citations c where c.source_storage_object_name=object_name and public.can_read_tenant(c.tenant_id));
end;
$$;

