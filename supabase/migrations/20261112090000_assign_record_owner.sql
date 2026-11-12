-- One owner for many records, in one request.
--
-- A register's reader chooses rows and assigns them an owner: every chosen record takes the party,
-- or none does. The records are named by their collection and their ids. A collection is one whose
-- records carry `owner_party_id` and a revision, and whose register offers the command: risks,
-- operational issues, evidence artifacts and remediation items.
--
-- It is safe to send again: a record that already holds the owner is left as it is, with its
-- revision, and counted as unchanged. A record that takes the owner moves to its next revision, so
-- an edit another session began from the revision before it fails instead of overwriting.
--
-- Security invoker: row-level security decides which records the session reads and writes. A
-- record the reader cannot read stops the whole request (it is gone, or it is another workspace's),
-- and so does one the reader cannot write, so a viewer assigns nothing and is told why.
create function public.assign_record_owner(
  p_collection text,
  p_record_ids uuid[],
  p_owner_party_id uuid
)
returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  asked uuid[];
  owner_tenant uuid;
  found integer;
  held integer;
  changed integer;
begin
  if auth.uid() is null then
    raise exception 'Workspace access is required' using errcode = '42501';
  end if;
  if p_collection is null
    or p_collection not in ('risks', 'operational_issues', 'evidence_artifacts', 'poam_items') then
    raise exception 'An owner cannot be assigned to these records in one request' using errcode = '22023';
  end if;
  asked := array(select distinct id from unnest(coalesce(p_record_ids, '{}'::uuid[])) as chosen(id) where id is not null);
  if cardinality(asked) = 0 then
    raise exception 'Choose at least one record' using errcode = '22023';
  end if;
  if cardinality(asked) > 5000 then
    raise exception 'Assign an owner to at most 5,000 records at a time' using errcode = '22023';
  end if;
  select p.tenant_id into owner_tenant from public.parties p where p.id = p_owner_party_id;
  if owner_tenant is null then
    raise exception 'Choose an owner from this workspace' using errcode = '22023';
  end if;
  -- Every record asked for is one the session reads, in the owner's workspace.
  execute format(
    'select count(*), count(*) filter (where r.owner_party_id is not distinct from $2)
       from public.%I r where r.id = any($1) and r.tenant_id = $3',
    p_collection)
    into found, held using asked, p_owner_party_id, owner_tenant;
  if found <> cardinality(asked) then
    raise exception 'Some of these records are no longer available; reload and choose again' using errcode = 'P0002';
  end if;
  execute format(
    'with done as (
       update public.%I r set owner_party_id = $2, revision = r.revision + 1
        where r.id = any($1) and r.tenant_id = $3 and r.owner_party_id is distinct from $2
       returning 1)
     select count(*) from done',
    p_collection)
    into changed using asked, p_owner_party_id, owner_tenant;
  -- Row-level security leaves out what the session may not write, without a word.
  if changed <> found - held then
    raise exception 'An editor, admin, or owner can assign an owner' using errcode = '42501';
  end if;
  return jsonb_build_object('assigned', changed, 'unchanged', held);
end; $$;

revoke all on function public.assign_record_owner(text, uuid[], uuid) from public, anon;
grant execute on function public.assign_record_owner(text, uuid[], uuid) to authenticated;
comment on function public.assign_record_owner(text, uuid[], uuid) is 'Assigns one owner to many records of one collection (risks, operational issues, evidence artifacts, remediation items) in one request: all of them or none. A record that already holds the owner is unchanged, so the request is safe to send again. Security invoker: a record the session cannot read or write stops the request.';
