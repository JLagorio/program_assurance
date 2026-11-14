-- Assign owner on a program's requirements.
--
-- The program's Requirements register takes Assign owner as the risk register does, through the
-- same command: every chosen requirement takes the owner or none does, a requirement that already
-- holds it is left as it is, and a reader who may not write is refused. The collection is named
-- by the table of the ids the register sends, `engineering_requirements`.
--
-- A requirement's owner is a field of its details, its current `requirement_revisions` row, the
-- row `edit_requirement` edits. The command writes that row as an edit of the owner is written:
-- at its next revision, so an edit another session began from the revision before it fails
-- instead of overwriting, and through the row's own triggers, so `audit_requirement_edit` records
-- each change in the requirement's history as it records an edit of the owner ("REQ-001: edited
-- Owner.", with the owner before and after). A requirement whose details are not recorded has no
-- owner to set: it stops the whole request, and the refusal names it.
create or replace function public.assign_record_owner(
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
  current_details uuid[];
  undetailed text[];
begin
  if auth.uid() is null then
    raise exception 'Workspace access is required' using errcode = '42501';
  end if;
  if p_collection is null or p_collection not in
    ('risks', 'operational_issues', 'evidence_artifacts', 'poam_items', 'engineering_requirements') then
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
  if p_collection = 'engineering_requirements' then
    -- Every requirement asked for is one the session reads, in the owner's workspace, and its
    -- owner is on its current details: its revision with the highest version number.
    select count(*),
      count(*) filter (where latest.id is not null and latest.owner_party_id is not distinct from p_owner_party_id),
      array_agg(latest.id) filter (where latest.id is not null),
      array_agg(r.code order by public.natural_sort_key(r.code) collate "C", r.code) filter (where latest.id is null)
      into found, held, current_details, undetailed
      from public.engineering_requirements r
      left join lateral (
        select v.id, v.owner_party_id
          from public.requirement_revisions v
         where v.tenant_id = r.tenant_id and v.engineering_requirement_id = r.id
         order by v.version_number desc
         limit 1
      ) latest on true
     where r.id = any(asked) and r.tenant_id = owner_tenant;
    if found <> cardinality(asked) then
      raise exception 'Some of these records are no longer available; reload and choose again' using errcode = 'P0002';
    end if;
    if undetailed is not null then
      raise exception '% % no details recorded. Record % details before assigning an owner.',
        case
          when cardinality(undetailed) = 1 then undetailed[1]
          when cardinality(undetailed) <= 3 then
            array_to_string(undetailed[1:cardinality(undetailed) - 1], ', ') || ' and ' || undetailed[cardinality(undetailed)]
          else array_to_string(undetailed[1:3], ', ') || ' and ' || (cardinality(undetailed) - 3) || ' more'
        end,
        case when cardinality(undetailed) = 1 then 'has' else 'have' end,
        case when cardinality(undetailed) = 1 then 'its' else 'their' end
        using errcode = '23514';
    end if;
    -- The current details take the owner as an edit of the owner does: at the next revision, and
    -- recorded in the requirement's history by the row's own audit trigger.
    with done as (
      update public.requirement_revisions v
         set owner_party_id = p_owner_party_id, revision = v.revision + 1
       where v.id = any(current_details) and v.tenant_id = owner_tenant
         and v.owner_party_id is distinct from p_owner_party_id
      returning 1)
    select count(*) into changed from done;
  else
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
  end if;
  -- Row-level security leaves out what the session may not write, without a word.
  if changed <> found - held then
    raise exception 'An editor, admin, or owner can assign an owner' using errcode = '42501';
  end if;
  return jsonb_build_object('assigned', changed, 'unchanged', held);
end; $$;

revoke all on function public.assign_record_owner(text, uuid[], uuid) from public, anon;
grant execute on function public.assign_record_owner(text, uuid[], uuid) to authenticated;
comment on function public.assign_record_owner(text, uuid[], uuid) is 'Assigns one owner to many records of one collection (risks, operational issues, evidence artifacts, remediation items, requirements) in one request: all of them or none. A requirement''s owner is on its current details, written at their next revision and recorded in its history as an edit of the owner; a requirement with no details stops the request. A record that already holds the owner is unchanged, so the request is safe to send again. Security invoker: a record the session cannot read or write stops the request.';
