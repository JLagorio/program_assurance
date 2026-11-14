-- "Results preview polish": an assessment results preview lists the findings the results hold, a
-- page at a time, each with the control it judges, in the catalog's reading order. The findings
-- register's view gains what that list shows and orders by, after its own columns: the control of
-- the part a finding judges (control_id, control_code), that part's place in the catalog's reading
-- order (reading_order, written as assessment_objective_rows writes an objective's: the control's
-- code in natural order, then the part's ordinal under each part above it, compared character by
-- character), and the finding's title in a reader's order (title_order, the natural_order
-- collation: Step 2 before Step 10). Redefined from the live definition; its columns keep their
-- place, nothing depends on the view, and a read that names none of the new columns joins nothing
-- more (each join is a left join on a key).
--
-- The campaign record's Objectives read assessment_objective_rows a page at a time too ("Page the
-- campaign's Objectives"): the view's comment says so.
--
-- Every statement here can run again.

create or replace view public.assessment_finding_rows with (security_invoker = true) as
select f.id,
  f.tenant_id,
  f.assessment_results_revision_id,
  f.result_set_id,
  f.target_control_part_id,
  f.title,
  f.description,
  f.determination,
  f.assessor_party_id,
  f.determined_at,
  f.revision,
  f.created_at,
  f.updated_at,
  f.created_by,
  f.updated_by,
  assessor.name as assessor_name,
  (exists (select 1 from public.finding_risks fr
    where fr.tenant_id = f.tenant_id and fr.finding_id = f.id)) as linked_to_risk,
  array_position('{satisfied,partially_satisfied,other_than_satisfied,not_assessed}'::text[], f.determination) as determination_rank,
  cp.control_id,
  k.code as control_code,
  case when k.id is not null then (public.natural_sort_key(k.code) || ' ' || concat_ws('.',
    lpad(p6.ordinal::text, 6, '0'), lpad(p5.ordinal::text, 6, '0'), lpad(p4.ordinal::text, 6, '0'),
    lpad(p3.ordinal::text, 6, '0'), lpad(p2.ordinal::text, 6, '0'), lpad(p1.ordinal::text, 6, '0'),
    lpad(cp.ordinal::text, 6, '0'))) collate "C"
  end as reading_order,
  f.title collate public.natural_order as title_order
from public.assessment_findings f
left join public.parties assessor on assessor.id = f.assessor_party_id
left join public.control_parts cp on cp.id = f.target_control_part_id
left join public.controls k on k.id = cp.control_id
left join public.control_parts p1 on p1.id = cp.parent_part_id
left join public.control_parts p2 on p2.id = p1.parent_part_id
left join public.control_parts p3 on p3.id = p2.parent_part_id
left join public.control_parts p4 on p4.id = p3.parent_part_id
left join public.control_parts p5 on p5.id = p4.parent_part_id
left join public.control_parts p6 on p6.id = p5.parent_part_id;
revoke all on public.assessment_finding_rows from public, anon;
grant select on public.assessment_finding_rows to authenticated;
comment on view public.assessment_finding_rows is 'The assessment findings, as the findings register and an assessment results preview read them a page at a time: every column of the finding, its assessor by name (assessor_name), whether a risk assessment links it (linked_to_risk), its determination''s rank in the product''s order (determination_rank), the control of the part it judges (control_id, control_code), that part''s place in the catalog''s reading order (reading_order, compared character by character: the control''s code in natural order, then the part''s ordinal under each part above it; none for a part of no control) and its title in a reader''s order (title_order, the natural_order collation). A results preview''s order: reading_order, title_order. Security invoker.';

comment on view public.assessment_objective_rows is 'A campaign''s objectives as its Objectives collections read them, each a page at a time: the Assessment campaigns page''s register, a program''s tab and a campaign record''s Execution tab. Every column of the objective, its plan''s campaign_id and that campaign''s program_id, target_kind (the kind of control part it is aimed at: assessment-objective, statement), target_label (an assessment objective''s label as SP 800-53A prints it, AC-08a.01), reading_order (the target''s place in the catalog''s reading order, compared character by character: the control''s code in natural order, then the part''s ordinal under each part above it; none without a control part), campaign_title, plan_title and plan_version, and sort keys in a reader''s order (campaign_order, plan_order, title_order: the titles in the natural_order collation, numbers by their value). The register''s own order: campaign_order, plan_version descending, plan_revision_id, reading_order, title_order; a campaign record''s, the same within its campaign. Security invoker.';

notify pgrst, 'reload schema';
