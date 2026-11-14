-- An objective heading that prints a sentence of its own counts on its own.
--
-- A control counted its leaf assessment objectives (20261114030116_objective_level_derivation):
-- those with no objective under them. An objective above others is the heading they sit under
-- (AC-08a. over AC-08a.01 to AC-08a.04), and most headings print nothing but their label. Nine print
-- a sentence of their own besides the objectives under them, a thing the assessor determines that no
-- objective under them says: PM-24's "a Data Integrity Board is established;", AC-08a., CA-07(04),
-- CM-07(07), PE-11(02), PM-21a., PM-27a., PM-31 and RA-05b. Each of them is now an objective the
-- control counts (Josef, 2026-11-13: "Count them too"):
--
--   a mapping that names the heading   covers it and every objective under it, as before
--   mappings of all its leaves         leave the heading's own sentence uncovered: the control
--                                      stays short of every objective covered
--   a mapping of the whole control,    covers every objective, the heading's sentence too, so a
--   a statement or an item             status read before this migration reads the same after
--
-- Which headings count is a rule, not a list: a heading counts when its text says something once
-- SP 800-53A's lead-in "Determine if:" is set aside (objective_prints_own_sentence). Two root
-- headings print only that lead-in, SA-24 and SI-02(07), and say nothing of their own. SP 800-53
-- Rev 5 then counts 2,785 objectives over its 1,014 controls that have objectives: 2,776 leaves
-- and the nine headings. AC-2 still counts 26; AC-8 counts 9, its heading AC-08a. among them.
--
--   objective_prints_own_sentence      the rule: whether an objective's text says something of its
--                                      own beside the "Determine if:" lead-in
--   program_control_objective_cover    counts each leaf and each heading the rule finds, so
--                                      program_control_status_lines (and through it
--                                      program_control_status and the daily posture snapshots) and
--                                      program_control_objectives count them
--
-- program_control_objectives lists a counted heading in the catalog's reading order, before the
-- objectives under it, with the heading's own label and text; the objectives under it name it among
-- the objectives above them, so a mapping of the heading covers them as the client reads it too.

-- ---------------------------------------------------------------------------------------------
-- The rule.
-- ---------------------------------------------------------------------------------------------
create or replace function public.objective_prints_own_sentence(p_prose text)
returns boolean language sql immutable parallel safe set search_path = '' as $$
  -- What the text says once a leading "Determine if:" is set aside: anything but white space.
  select coalesce(regexp_replace(p_prose, '^\s*determine if:', '', 'i') ~ '\S', false);
$$;
revoke all on function public.objective_prints_own_sentence(text) from public, anon;
grant execute on function public.objective_prints_own_sentence(text) to authenticated;
comment on function public.objective_prints_own_sentence(text) is 'Whether an assessment objective''s text says something of its own: anything but white space once SP 800-53A''s lead-in "Determine if:" is set aside. A heading objective (one with objectives under it) that does is an objective its control counts, beside its leaves; nine of SP 800-53 Rev 5''s do (PM-24, AC-08a., CA-07(04), CM-07(07), PE-11(02), PM-21a., PM-27a., PM-31, RA-05b.), and SA-24''s and SI-02(07)''s root headings print only the lead-in.';

-- ---------------------------------------------------------------------------------------------
-- Which of the program's requirements cover each objective of the named controls: the body of
-- 20261114030116_objective_level_derivation, counting each heading the rule finds beside the leaves.
-- ---------------------------------------------------------------------------------------------
create or replace function public.program_control_objective_cover(p_program_id uuid, p_control_ids uuid[])
returns table (control_id uuid, objective_id uuid, requirement_id uuid, evidenced boolean)
language plpgsql stable security invoker set search_path = '' as $$
#variable_conflict use_column
begin
  -- A program the caller cannot read is refused, never answered as covering nothing.
  if not exists (select 1 from public.programs p where p.id = p_program_id) then
    raise exception 'Program access is required' using errcode = '42501';
  end if;
  return query
  with recursive
  objective as materialized (
    select cp.id, cp.control_id, cp.parent_part_id, cp.prose
    from public.control_parts cp
    where cp.name = 'assessment-objective' and cp.control_id = any(p_control_ids)
  ),
  -- The objectives a control counts: its leaves, with no objective under them, and each heading
  -- that prints a sentence of its own besides the objectives under it.
  counted as materialized (
    select o.id, o.control_id
    from objective o
    where not exists (select 1 from objective c where c.parent_part_id = o.id)
      or public.objective_prints_own_sentence(o.prose)
  ),
  -- Each counted objective with itself and every objective above it, since a mapping that names
  -- any of them covers it. Sixteen levels bound a broken chain; the catalog nests four.
  reach as (
    select k.id as counted_id, k.id as part_id, o.parent_part_id as parent_id, 1 as depth
    from counted k
    join objective o on o.id = k.id
    union all
    select r.counted_id, o.id, o.parent_part_id, r.depth + 1
    from reach r
    join objective o on o.id = r.parent_id
    where r.depth < 16
  ),
  -- The program's requirements whose latest revision maps one of the controls, and the objective
  -- each mapping names: none where it maps the whole control, or names a statement, an item or a
  -- part that is not one of the control's objectives, which cover the whole control.
  met as materialized (
    select distinct l.control_id, q.id as requirement_id, v.id as revision_id,
      case when cp.name = 'assessment-objective' and cp.control_id = l.control_id
        then l.control_part_id end as objective_id
    from public.requirement_control_links l
    join public.requirement_revisions v on v.tenant_id = l.tenant_id and v.id = l.requirement_revision_id
    join public.engineering_requirements q on q.tenant_id = v.tenant_id and q.id = v.engineering_requirement_id
    left join public.control_parts cp on cp.id = l.control_part_id
    where q.program_id = p_program_id
      and l.control_id = any(p_control_ids)
      and v.version_number = (select max(x.version_number) from public.requirement_revisions x
        where x.tenant_id = v.tenant_id and x.engineering_requirement_id = v.engineering_requirement_id)
  ),
  evidenced as materialized (
    select distinct m.requirement_id
    from met m
    join public.requirement_evidence re on re.requirement_revision_id = m.revision_id
    join public.evidence_versions ev on ev.tenant_id = re.tenant_id and ev.id = re.evidence_version_id
  ),
  -- Which requirements cover each counted objective: a mapping of the whole control covers every
  -- one of it, and one that names an objective the objectives at and under it. Two hash joins,
  -- never a test of every mapping against every objective.
  covered as materialized (
    select k.id as counted_id, m.requirement_id
    from counted k
    join met m on m.control_id = k.control_id and m.objective_id is null
    union
    select r.counted_id, m.requirement_id
    from reach r
    join met m on m.objective_id = r.part_id
  )
  select k.control_id, k.id, c.requirement_id, e.requirement_id is not null
  from counted k
  left join covered c on c.counted_id = k.id
  left join evidenced e on e.requirement_id = c.requirement_id;
end; $$;
revoke all on function public.program_control_objective_cover(uuid, uuid[]) from public, anon;
grant execute on function public.program_control_objective_cover(uuid, uuid[]) to authenticated;
comment on function public.program_control_objective_cover(uuid, uuid[]) is 'Internal: each assessment objective the named controls count (a leaf, with no objective under it, or a heading that prints a sentence of its own beside the objectives under it, objective_prints_own_sentence), once with each of the program''s requirements whose latest revision covers it and whether that requirement cites evidence, and once with no requirement where none covers it. A mapping covers the objective it names and every objective under it; one that names no part, a statement or an item covers the whole control. Security invoker: a program the caller cannot read is refused. program_control_status_lines and program_control_objectives read it.';

-- The reads over it keep their bodies; what they count is said again.
comment on function public.program_control_objectives(uuid, uuid) is 'The assessment objectives one control counts (its leaf objectives, and each heading that prints a sentence of its own, which comes before the objectives under it), in the catalog''s reading order, each with its label (AC-02a.[01]), its text, the objectives above it, whether the program''s requirements cover it (mapped) and whether one that covers it cites evidence (evidenced), and the requirements that cover it by code. A control with no objective answers none. Counted as program_control_status counts (program_control_objective_cover). Security invoker: a program the reader cannot read is refused.';

notify pgrst, 'reload schema';
