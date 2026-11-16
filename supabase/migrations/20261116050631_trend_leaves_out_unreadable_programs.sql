-- The Portfolio's trends answer the programs the reader can read (Josef, 2026-11-15: "Portfolio
-- reads scoped", the trend read leaving out a program it cannot read).
--
-- ensure_program_posture_snapshots and program_posture_trend (20261113223837_posture_snapshots)
-- refused the whole list when any program in it could not be read. The Portfolio's Recently
-- updated programs names its five rows from one read and asks their trends in a second, so a
-- program deleted between the two raised the widget's alert for every row's sparkline until Retry.
-- Both now answer each named program the reader can read and leave the others out, as
-- program_control_status_counts does since 20261115214155: the command takes today's snapshot of
-- each named program the caller can read that has none, and the read answers those programs'
-- snapshots. A program that does not exist, or another workspace's, takes nothing and has no
-- snapshot in the answer, so its row draws no sparkline while the others draw theirs. The other
-- rules stay: a session with no account, a list left unnamed or naming a program left unnamed, and
-- (for the command) more than 100 programs at once are refused.
--
-- Both functions are redefined from their text in 20261113223837_posture_snapshots, the live
-- definitions (no later migration redefines them), with only the refusal changed.
--
-- Every statement here can run again.

-- ---------------------------------------------------------------------------------------------
-- The command a trend calls before it reads: today's snapshot of each named program that has none.
-- ---------------------------------------------------------------------------------------------
create or replace function public.ensure_program_posture_snapshots(p_program_ids uuid[])
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_day date := (clock_timestamp() at time zone 'utc')::date;
  v_id uuid;
  v_taken uuid[] := '{}';
begin
  -- A session with no account, a list left unnamed and a program left unnamed are refused. A named
  -- program the caller cannot read (gone since the list was made, or another workspace's) is left
  -- out: it takes no snapshot, and the others take theirs.
  if auth.uid() is null or p_program_ids is null
    or exists (select 1 from unnest(p_program_ids) n(id) where n.id is null) then
    raise exception 'Program access is required' using errcode = '42501';
  end if;
  if cardinality(p_program_ids) > 100 then
    raise exception 'Ask for at most 100 programs at once' using errcode = '22023';
  end if;
  for v_id in
    select p.id from public.programs p
    where p.id = any(p_program_ids)
      and public.can_read_tenant(p.tenant_id)
      and exists (select 1 from public.program_reference_choices c where c.program_id = p.id)
      and not exists (select 1 from public.program_posture_snapshots s where s.program_id = p.id and s.taken_on = v_day)
    order by p.id
  loop
    perform public.take_program_posture_snapshots(v_id);
    v_taken := v_taken || v_id;
  end loop;
  return jsonb_build_object('taken_on', v_day, 'taken', to_jsonb(v_taken));
end; $$;
revoke all on function public.ensure_program_posture_snapshots(uuid[]) from public, anon;
grant execute on function public.ensure_program_posture_snapshots(uuid[]) to authenticated;
comment on function public.ensure_program_posture_snapshots(uuid[]) is 'Take today''s (UTC) control status snapshot of each named program that records a control baseline and has none yet, so a trend fills where the daily job has not run. It never counts a day again. A named program the caller cannot read (gone, or another workspace''s) is left out and takes nothing; any member may ask, since the counts are the server''s. Answers the day and the programs it took. A session with no account, a list or a program left unnamed and more than 100 programs at once are refused.';

-- ---------------------------------------------------------------------------------------------
-- The read: the named programs' snapshots, by program and then day.
-- ---------------------------------------------------------------------------------------------
create or replace function public.program_posture_trend(p_program_ids uuid[], p_since date default null)
returns setof public.program_posture_snapshots
language plpgsql stable security invoker set search_path = '' as $$
begin
  -- A session with no account, a list left unnamed and a program left unnamed are refused. A named
  -- program the reader cannot read (gone since the list was made, or another workspace's) has no
  -- snapshot row-level security lets the reader read, so the answer leaves it out.
  if auth.uid() is null or p_program_ids is null
    or exists (select 1 from unnest(p_program_ids) n(id) where n.id is null) then
    raise exception 'Program access is required' using errcode = '42501';
  end if;
  return query
    select s.* from public.program_posture_snapshots s
    where s.program_id = any(p_program_ids) and (p_since is null or s.taken_on >= p_since)
    order by s.program_id, s.taken_on;
end; $$;
revoke all on function public.program_posture_trend(uuid[], date) from public, anon;
grant execute on function public.program_posture_trend(uuid[], date) to authenticated;
comment on function public.program_posture_trend(uuid[], date) is 'The control status snapshots of the named programs the reader can read, by program and then UTC day, from p_since on when it is given. Security invoker: a named program the reader cannot read (gone, or another workspace''s) is left out of the answer; a session with no account and a list or a program left unnamed are refused.';

notify pgrst, 'reload schema';
