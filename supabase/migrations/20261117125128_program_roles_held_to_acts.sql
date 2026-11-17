-- A program records who holds its roles, and two acts are held to them.
--
-- Josef, 2026-11-16 (the UX proposal's round 11): "Role-true slot" (each program records its roles,
-- so a record's action slot holds the reader's own next step or says who it waits on) and "Enforce
-- by role" (the assessor judges, the lead assessor publishes, only the authorizing official signs).
--
-- A program already records its people's roles: program_role_assignments, a party (a person or an
-- organization) in a role on a program, for a period (starts_on, ends_on), which program setup and
-- the demo seeds write. This migration keeps that table as the one home of the fact, and adds:
--
--   roles            two values RMF names that the table lacked: lead_assessor (the security control
--                    assessor who publishes the program's assessment results) and security_manager
--                    (the ISSM). security_officer is the ISSO and system_owner the system owner, as
--                    before; program_manager, control_owner and reviewer stay as recorded roles. The
--                    order and the one-holder rule are program_role_vocabulary.
--   one at a time    a program has at most one authorizing official and one lead assessor on any
--                    day: guard_program_role_holder refuses a second whose days overlap the first's
--                    (an unbounded start or end is open), under a lock on the program and role, so
--                    two sessions cannot both add one. Assessors, ISSMs, ISSOs and the rest may be
--                    several. A holder hands over by ending their days and the next starting after.
--   held to roles    where a program records an authorizing official (any assignment of the role,
--                    on any day), only a holder of the role today records an authorization decision
--                    on a package of the program, and the decision names a holder as its decision
--                    maker; where it records a lead assessor, only a holder today publishes its
--                    assessment results, by publish_assessment_results or by setting a draft's state,
--                    and the results name a holder as their publisher. A party holds a role when it
--                    is the holder or belongs to the organization that is (parties.organization_id,
--                    at any depth). A session with no account (the seeds, run as the database owner)
--                    is not a caller, so only the party a record names is checked. Where a program
--                    records nobody in the role, every command and write behaves as before.
--   reads            program_roles, a program's roles in the vocabulary's order with the holders of
--                    each today by name, in one request; program_reader_roles, the roles the signed-in
--                    reader holds on a program today, through their own party in the workspace (as
--                    publish_assessment_results finds the publisher's party). Both security invoker.
--
-- Nothing else changes: the table's columns, policies (viewers read, members who may write write) and
-- every existing row stay as they were, and so do the commands.
--
-- Every statement here can run again.

-- ---------------------------------------------------------------------------------------------
-- The roles a program records, with the two RMF names it lacked.
-- ---------------------------------------------------------------------------------------------
alter table public.program_role_assignments drop constraint if exists program_role_assignments_role_check;
alter table public.program_role_assignments add constraint program_role_assignments_role_check check (role in (
  'authorizing_official', 'lead_assessor', 'assessor', 'security_manager', 'security_officer',
  'system_owner', 'program_manager', 'control_owner', 'reviewer'));

-- Who holds what on a program, and a program's holders of one role.
create index if not exists program_role_assignments_program_role_idx
  on public.program_role_assignments(program_id, role);
create index if not exists program_role_assignments_party_idx
  on public.program_role_assignments(tenant_id, party_id);

comment on table public.program_role_assignments is 'A person or organization in a role on a program, for a period. A program has one authorizing official and one lead assessor at a time; where it records one, only that holder records its authorization decisions or publishes its assessment results.';
comment on column public.program_role_assignments.role is 'What they answer for on this program. A program has one authorizing official and one lead assessor at a time: once it records them, only the authorizing official records its authorization decisions and only the lead assessor publishes its assessment results.';
comment on column public.program_role_assignments.party_id is 'The person or organization who holds the role. People who belong to an organization act for it in the role.';
comment on column public.program_role_assignments.starts_on is 'The first day they hold the role. Leave it empty if they hold it from the start.';
comment on column public.program_role_assignments.ends_on is 'The last day they hold the role. Leave it empty while they still hold it.';

-- ---------------------------------------------------------------------------------------------
-- Internal: the roles in RMF's order, which may have only one holder, and their words.
-- ---------------------------------------------------------------------------------------------
create or replace function public.program_role_vocabulary()
returns table (role text, role_rank integer, one_holder boolean, words text)
language sql immutable set search_path = '' as $$
  select v.role, v.role_rank, v.one_holder, v.words
  from (values
    ('authorizing_official', 1, true, 'authorizing official'),
    ('lead_assessor', 2, true, 'lead assessor'),
    ('assessor', 3, false, 'assessor'),
    ('security_manager', 4, false, 'ISSM'),
    ('security_officer', 5, false, 'ISSO'),
    ('system_owner', 6, false, 'system owner'),
    ('program_manager', 7, false, 'program manager'),
    ('control_owner', 8, false, 'control owner'),
    ('reviewer', 9, false, 'reviewer')
  ) v(role, role_rank, one_holder, words)
$$;
revoke all on function public.program_role_vocabulary() from public, anon;
grant execute on function public.program_role_vocabulary() to authenticated;
comment on function public.program_role_vocabulary() is 'Internal: every role program_role_assignments.role allows, in RMF''s order (role_rank), whether a program has only one holder of it at a time (one_holder) and its words in a sentence. The reads answer roles in this order.';

-- ---------------------------------------------------------------------------------------------
-- Internal: whether a party holds a role on a program on a day: it is the holder, or it belongs to
-- the organization that is, at any depth.
-- ---------------------------------------------------------------------------------------------
create or replace function public.program_role_held_by(
  p_program_id uuid,
  p_role text,
  p_party_id uuid,
  p_on date default current_date
) returns boolean
language sql stable security invoker set search_path = '' as $$
  with recursive party_and_organizations as (
    select p.tenant_id, p.id, p.organization_id from public.parties p where p.id = p_party_id
    union
    select o.tenant_id, o.id, o.organization_id from public.parties o
    join party_and_organizations w on o.tenant_id = w.tenant_id and o.id = w.organization_id
  )
  select exists (
    select 1 from public.program_role_assignments a
    join party_and_organizations w on w.tenant_id = a.tenant_id and w.id = a.party_id
    where a.program_id = p_program_id and a.role = p_role
      and (a.starts_on is null or a.starts_on <= p_on)
      and (a.ends_on is null or a.ends_on >= p_on))
$$;
revoke all on function public.program_role_held_by(uuid, text, uuid, date) from public, anon;
grant execute on function public.program_role_held_by(uuid, text, uuid, date) to authenticated;
comment on function public.program_role_held_by(uuid, text, uuid, date) is 'Internal: whether a party holds a role on a program on a day (today unless named): an assignment of the role in force that day names the party, or an organization the party belongs to at any depth. False for no party. Security invoker.';

-- Internal: whether a program records anybody in a role, on any day. Where it does not, the acts a
-- role holds stay open to every member who may write, as before.
create or replace function public.program_role_recorded(p_program_id uuid, p_role text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.program_role_assignments a
    where a.program_id = p_program_id and a.role = p_role)
$$;
revoke all on function public.program_role_recorded(uuid, text) from public, anon;
grant execute on function public.program_role_recorded(uuid, text) to authenticated;
comment on function public.program_role_recorded(uuid, text) is 'Internal: whether a program records any assignment of a role, on any day. Security invoker.';

-- Internal: why a party may not do the act a program's role holds, in the reader's words, or null
-- where it may: the program records nobody in the role, or the party holds it today.
create or replace function public.program_role_refusal(
  p_program_id uuid,
  p_role text,
  p_party_id uuid,
  p_act text
) returns text
language plpgsql stable security invoker set search_path = '' as $$
declare v_words text; v_program text; v_holders text;
begin
  if not public.program_role_recorded(p_program_id, p_role)
    or public.program_role_held_by(p_program_id, p_role, p_party_id) then
    return null;
  end if;
  select v.words into v_words from public.program_role_vocabulary() v where v.role = p_role;
  select g.name into v_program from public.programs g where g.id = p_program_id;
  select string_agg(p.name, ' and ' order by p.name) into v_holders
    from public.program_role_assignments a
    join public.parties p on p.tenant_id = a.tenant_id and p.id = a.party_id
    where a.program_id = p_program_id and a.role = p_role
      and (a.starts_on is null or a.starts_on <= current_date)
      and (a.ends_on is null or a.ends_on >= current_date);
  if v_holders is null then
    return format('Nobody is the %s of %s today, so nobody can %s. Record who is.', v_words, v_program, p_act);
  end if;
  return format('Only %s, the %s of %s, can %s.', v_holders, v_words, v_program, p_act);
end $$;
revoke all on function public.program_role_refusal(uuid, text, uuid, text) from public, anon;
grant execute on function public.program_role_refusal(uuid, text, uuid, text) to authenticated;
comment on function public.program_role_refusal(uuid, text, uuid, text) is 'Internal: why a party may not do an act a program''s role holds ("Only R. Calloway, the authorizing official of WS-X90, can record its authorization decisions."), or null where it may: the program records nobody in the role, or the party holds it today. Security invoker.';

-- ---------------------------------------------------------------------------------------------
-- One authorizing official and one lead assessor at a time.
-- ---------------------------------------------------------------------------------------------
create or replace function public.guard_program_role_holder() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_one boolean; v_words text; v_other text; v_program text;
begin
  select v.one_holder, v.words into v_one, v_words from public.program_role_vocabulary() v where v.role = new.role;
  if not coalesce(v_one, false) then
    return new;
  end if;
  -- Two sessions adding a holder of the same role to the same program take turns, so the second
  -- reads the first's.
  perform pg_advisory_xact_lock(hashtextextended(
    'program-role/' || new.tenant_id::text || '/' || new.program_id::text || '/' || new.role, 0));
  select p.name into v_other from public.program_role_assignments a
    join public.parties p on p.tenant_id = a.tenant_id and p.id = a.party_id
    where a.tenant_id = new.tenant_id and a.program_id = new.program_id and a.role = new.role
      and a.id <> new.id
      and daterange(a.starts_on, a.ends_on, '[]') && daterange(new.starts_on, new.ends_on, '[]')
    order by p.name limit 1;
  if v_other is not null then
    select g.name into v_program from public.programs g where g.tenant_id = new.tenant_id and g.id = new.program_id;
    raise exception '% is already the % of % on those days. A program has one % at a time: end their days first.',
      v_other, v_words, v_program, v_words using errcode = '23514';
  end if;
  return new;
end $$;
revoke all on function public.guard_program_role_holder() from public, anon, authenticated;
comment on function public.guard_program_role_holder() is 'Refuses a second authorizing official or lead assessor of a program whose days overlap another''s (an empty start or end is open), under a lock on the program and the role.';

drop trigger if exists one_holder on public.program_role_assignments;
create trigger one_holder before insert or update on public.program_role_assignments
  for each row execute function public.guard_program_role_holder();

-- ---------------------------------------------------------------------------------------------
-- Only the authorizing official records an authorization decision, where the program records one.
-- ---------------------------------------------------------------------------------------------
create or replace function public.guard_authorization_decision_role() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_program uuid; v_name text; v_caller uuid; v_refusal text; v_holders text;
begin
  select k.program_id, g.name into v_program, v_name from public.package_revisions r
    join public.authorization_packages k on k.tenant_id = r.tenant_id and k.id = r.package_id
    join public.programs g on g.tenant_id = k.tenant_id and g.id = k.program_id
    where r.tenant_id = new.tenant_id and r.id = new.package_revision_id;
  if v_program is null or not public.program_role_recorded(v_program, 'authorizing_official') then
    return new;
  end if;
  -- The caller signs: their party in the workspace, or an organization it belongs to, holds the role.
  if auth.uid() is not null then
    select p.id into v_caller from public.parties p where p.tenant_id = new.tenant_id and p.auth_user_id = auth.uid();
    v_refusal := public.program_role_refusal(v_program, 'authorizing_official', v_caller,
      'record its authorization decisions');
    if v_refusal is not null then
      raise exception using message = v_refusal, errcode = '42501';
    end if;
  end if;
  -- And the decision is theirs: it names a holder as its decision maker.
  v_refusal := public.program_role_refusal(v_program, 'authorizing_official', new.decision_maker_party_id,
    'make its authorization decisions');
  if v_refusal is not null then
    select string_agg(p.name, ' and ' order by p.name) into v_holders
      from public.program_role_assignments a
      join public.parties p on p.tenant_id = a.tenant_id and p.id = a.party_id
      where a.program_id = v_program and a.role = 'authorizing_official'
        and (a.starts_on is null or a.starts_on <= current_date)
        and (a.ends_on is null or a.ends_on >= current_date);
    if v_holders is null then
      raise exception using message = v_refusal, errcode = '42501';
    end if;
    raise exception using errcode = '42501', message = format(
      'An authorization decision on %s is its authorizing official''s: name %s as the decision maker.',
      v_name, v_holders);
  end if;
  return new;
end $$;
revoke all on function public.guard_authorization_decision_role() from public, anon, authenticated;
comment on function public.guard_authorization_decision_role() is 'Where the package''s program records an authorizing official, refuses an authorization decision recorded by a signed-in caller who does not hold the role today, or naming a decision maker who does not. A program that records none is left as before.';

drop trigger if exists held_to_role on public.authorization_decisions;
create trigger held_to_role before insert on public.authorization_decisions
  for each row execute function public.guard_authorization_decision_role();

-- ---------------------------------------------------------------------------------------------
-- Only the lead assessor publishes assessment results, where the program records one.
-- ---------------------------------------------------------------------------------------------
create or replace function public.guard_results_publication_role() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_program uuid; v_name text; v_caller uuid; v_refusal text; v_holders text;
begin
  if tg_op = 'UPDATE' and old.state = 'published' then
    return new;
  end if;
  select c.program_id, g.name into v_program, v_name from public.assessment_plan_revisions pl
    join public.assessment_campaigns c on c.tenant_id = pl.tenant_id and c.id = pl.campaign_id
    join public.programs g on g.tenant_id = c.tenant_id and g.id = c.program_id
    where pl.tenant_id = new.tenant_id and pl.id = new.assessment_plan_revision_id;
  if v_program is null or not public.program_role_recorded(v_program, 'lead_assessor') then
    return new;
  end if;
  if auth.uid() is not null then
    select p.id into v_caller from public.parties p where p.tenant_id = new.tenant_id and p.auth_user_id = auth.uid();
    v_refusal := public.program_role_refusal(v_program, 'lead_assessor', v_caller,
      'publish its assessment results');
    if v_refusal is not null then
      raise exception using message = v_refusal, errcode = '42501';
    end if;
  end if;
  v_refusal := public.program_role_refusal(v_program, 'lead_assessor', new.published_by_party_id,
    'publish its assessment results');
  if v_refusal is not null then
    select string_agg(p.name, ' and ' order by p.name) into v_holders
      from public.program_role_assignments a
      join public.parties p on p.tenant_id = a.tenant_id and p.id = a.party_id
      where a.program_id = v_program and a.role = 'lead_assessor'
        and (a.starts_on is null or a.starts_on <= current_date)
        and (a.ends_on is null or a.ends_on >= current_date);
    if v_holders is null then
      raise exception using message = v_refusal, errcode = '42501';
    end if;
    raise exception using errcode = '42501', message = format(
      'Assessment results of %s are published by its lead assessor: name %s as their publisher.',
      v_name, v_holders);
  end if;
  return new;
end $$;
revoke all on function public.guard_results_publication_role() from public, anon, authenticated;
comment on function public.guard_results_publication_role() is 'Where the campaign''s program records a lead assessor, refuses publishing assessment results (by publish_assessment_results or by setting a draft''s state) by a signed-in caller who does not hold the role today, or naming a publisher who does not. A program that records none is left as before.';

drop trigger if exists held_to_role on public.assessment_results_revisions;
create trigger held_to_role before insert or update of state on public.assessment_results_revisions
  for each row when (new.state = 'published') execute function public.guard_results_publication_role();

-- ---------------------------------------------------------------------------------------------
-- A program's roles, with the holders of each today by name.
-- ---------------------------------------------------------------------------------------------
create or replace function public.program_roles(p_program_id uuid)
returns table (role text, role_rank integer, one_holder boolean, recorded boolean, holders jsonb)
language plpgsql stable security invoker set search_path = '' as $$
#variable_conflict use_column
declare v_tenant uuid;
begin
  select p.tenant_id into v_tenant from public.programs p where p.id = p_program_id;
  if auth.uid() is null or v_tenant is null then
    raise exception 'Program access is required' using errcode = '42501';
  end if;
  return query
  select v.role, v.role_rank, v.one_holder,
    exists (select 1 from public.program_role_assignments a
      where a.tenant_id = v_tenant and a.program_id = p_program_id and a.role = v.role),
    coalesce((
      select jsonb_agg(jsonb_build_object(
          'assignment_id', a.id,
          'party_id', a.party_id,
          'name', p.name,
          'party_type', p.party_type,
          'starts_on', a.starts_on,
          'ends_on', a.ends_on,
          'revision', a.revision)
        order by p.name, a.id)
      from public.program_role_assignments a
      join public.parties p on p.tenant_id = a.tenant_id and p.id = a.party_id
      where a.tenant_id = v_tenant and a.program_id = p_program_id and a.role = v.role
        and (a.starts_on is null or a.starts_on <= current_date)
        and (a.ends_on is null or a.ends_on >= current_date)), '[]'::jsonb)
  from public.program_role_vocabulary() v
  order by v.role_rank;
end $$;
revoke all on function public.program_roles(uuid) from public, anon;
grant execute on function public.program_roles(uuid) to authenticated;
comment on function public.program_roles(uuid) is 'A program''s roles, one row each in RMF''s order (role_rank), held or not: whether it has one holder at a time (one_holder), whether the program records anybody in it on any day (recorded: where it does, the act the role holds is held to it), and the holders today by name (holders: assignment_id, party_id, name, party_type, starts_on, ends_on, revision, by name). Security invoker: a session with no account and a program the reader cannot read are refused.';

-- ---------------------------------------------------------------------------------------------
-- The roles the signed-in reader holds on a program today.
-- ---------------------------------------------------------------------------------------------
create or replace function public.program_reader_roles(p_program_id uuid)
returns table (role text, role_rank integer, party_id uuid, holder_party_id uuid, assignment_id uuid,
  starts_on date, ends_on date)
language plpgsql stable security invoker set search_path = '' as $$
#variable_conflict use_column
declare v_tenant uuid; v_party uuid;
begin
  select p.tenant_id into v_tenant from public.programs p where p.id = p_program_id;
  if auth.uid() is null or v_tenant is null then
    raise exception 'Program access is required' using errcode = '42501';
  end if;
  select p.id into v_party from public.parties p where p.tenant_id = v_tenant and p.auth_user_id = auth.uid();
  if v_party is null then
    return;
  end if;
  return query
  with recursive party_and_organizations as (
    select p.tenant_id, p.id, p.organization_id from public.parties p where p.id = v_party
    union
    select o.tenant_id, o.id, o.organization_id from public.parties o
    join party_and_organizations w on o.tenant_id = w.tenant_id and o.id = w.organization_id
  )
  select a.role, v.role_rank, v_party, a.party_id, a.id, a.starts_on, a.ends_on
  from public.program_role_assignments a
  join party_and_organizations w on w.tenant_id = a.tenant_id and w.id = a.party_id
  join public.program_role_vocabulary() v on v.role = a.role
  where a.tenant_id = v_tenant and a.program_id = p_program_id
    and (a.starts_on is null or a.starts_on <= current_date)
    and (a.ends_on is null or a.ends_on >= current_date)
  -- The reader's own assignment before one through an organization.
  order by v.role_rank, (a.party_id <> v_party), a.id;
end $$;
revoke all on function public.program_reader_roles(uuid) from public, anon;
grant execute on function public.program_reader_roles(uuid) to authenticated;
comment on function public.program_reader_roles(uuid) is 'The roles the signed-in reader holds on a program today, one row an assignment in RMF''s order: through their own party in the program''s workspace (party_id), as the holder or as one of an organization that is (holder_party_id). None for a reader with no party in the workspace or no role. Security invoker: a session with no account and a program the reader cannot read are refused.';

notify pgrst, 'reload schema';
