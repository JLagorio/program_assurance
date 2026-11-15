-- The Portfolio's counts answer the programs the reader can read.
--
-- program_control_status_counts (20261114195455_faster_status_reads) refused the whole list when
-- any program in it could not be read. The Portfolio's Recently updated programs names its five
-- rows from one read and asks their counts in a second, so a program deleted between the two turned
-- every row's Controls satisfied into Could not load until Retry. The read now answers each named
-- program the reader can read and leaves the others out, as a read of the programs table does: a
-- program that does not exist, or another workspace's, is not in the answer, and the Portfolio draws
-- a program missing from it as Absent (Not available). It still never answers a program it cannot
-- read as one with no control baseline. The other rules stay: a session with no account, a list
-- left unnamed or naming a program left unnamed, and more than 100 programs at once are refused.
--
-- The function is redefined from its text in 20261114195455_faster_status_reads, which is the live
-- definition (no later migration redefines it), with only the refusal changed.
--
-- Every statement here can run again.

create or replace function public.program_control_status_counts(p_program_ids uuid[])
returns table (
  program_id uuid,
  baseline boolean,
  controls bigint,
  no_requirement bigint,
  no_evidence bigint,
  not_assessed bigint,
  other_than_satisfied bigint,
  partially_satisfied bigint,
  satisfied bigint
)
language plpgsql
stable
set search_path = ''
as $$
#variable_conflict use_column
begin
  -- A session with no account, a list left unnamed and a program left unnamed are refused. A named
  -- program the reader cannot read (gone since the list was made, or another workspace's) is left
  -- out of the answer, never answered as one with no control baseline.
  if auth.uid() is null or p_program_ids is null
    or exists (select 1 from unnest(p_program_ids) n(id) where n.id is null) then
    raise exception 'Program access is required' using errcode = '42501';
  end if;
  if cardinality(p_program_ids) > 100 then
    raise exception 'Ask for at most 100 programs at once' using errcode = '22023';
  end if;
  return query
  select w.id,
    -- Whether the program records a control baseline at all, as program_control_status says it.
    exists (select 1 from public.program_reference_choices c where c.program_id = w.id),
    count(l.id),
    count(l.id) filter (where l.status = 'no_requirement'),
    count(l.id) filter (where l.status = 'no_evidence'),
    count(l.id) filter (where l.status = 'not_assessed'),
    count(l.id) filter (where l.status = 'other_than_satisfied'),
    count(l.id) filter (where l.status = 'partially_satisfied'),
    count(l.id) filter (where l.status = 'satisfied')
  -- The named programs row-level security lets the reader read, each once.
  from (select p.id from public.programs p where p.id = any(p_program_ids)) w
  left join lateral public.program_control_status_lines(w.id) l on true
  group by w.id
  order by w.id;
end; $$;

revoke all on function public.program_control_status_counts(uuid[]) from public, anon;
grant execute on function public.program_control_status_counts(uuid[]) to authenticated;
comment on function public.program_control_status_counts(uuid[]) is 'Each named program''s control status counts, for a widget that lists a few programs (the Portfolio''s Recently updated programs): whether it records a control baseline (baseline), how many controls its baseline selects (controls) and how many stand at each control status, counted from program_control_status_lines as program_control_status counts its totals and the posture snapshots count theirs. One row a program the reader can read, by id: a named program the reader cannot read (gone, or another workspace''s) is left out, never answered as one with no control baseline. Security invoker; a session with no account, a list or a program left unnamed and more than 100 programs at once are refused.';
