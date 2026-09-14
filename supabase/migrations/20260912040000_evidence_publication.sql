-- A reserved upload must be linked before publication, even if a separate
-- external location is also recorded. Keep incomplete upload recovery possible.
create or replace function public.guard_evidence_storage_reference() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.storage_object_id is not null and not exists (
    select 1 from storage.objects o where o.id = new.storage_object_id
      and o.bucket_id = 'evidence' and o.name = new.storage_object_name
  ) then
    raise exception 'Evidence object must match the tenant-owned version path' using errcode = '23514';
  end if;
  if new.state = 'published' and new.storage_object_name is not null and new.storage_object_id is null then
    raise exception 'Finish or recover the reserved evidence upload before publishing' using errcode = '23514';
  end if;
  if new.state = 'published' and new.external_uri is null and new.storage_object_id is null then
    raise exception 'Published evidence requires an external location or an uploaded object' using errcode = '23514';
  end if;
  return new;
end;
$$;
