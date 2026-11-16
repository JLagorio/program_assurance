-- Reader's words where the shared-component migrations reach an existing form.
--
-- The generic record forms print a column's comment under its field, and Create assessment
-- campaign and the library's Create component are such forms. So a comment on a column they offer
-- is written for the reader: no NULL and no stored value. And a campaign that is a Cyber T&E test
-- without naming its phase, or names a phase without being one, is refused in the reader's words
-- before the check constraints answer in the schema's.
--
-- Every statement here can run again.

comment on column public.component_definitions.owner_party_id is 'The person or organization that answers for the component across everything built from it.';
comment on column public.component_definitions.business_line_id is 'The business line the component belongs to.';
comment on column public.assessment_campaigns.kind is 'A control assessment, or a Cyber T&E test. The findings of either are assessment findings.';
comment on column public.assessment_campaigns.cyber_test_phase is 'The phase of a Cyber T&E campaign. Leave it empty for a control assessment.';
comment on column public.component_assessments.kind is 'A control assessment, or a Cyber T&E test of the component, recorded once for everything built from it.';

-- The two checks (assessment_campaigns_kind, assessment_campaigns_cyber_test_phase) still say
-- which values a kind and a phase take, and assessment_campaigns_cyber_test still holds the rule;
-- this guard says the rule first, in words a form can show.
create or replace function public.guard_campaign_kind() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.kind = 'cyber_test' and new.cyber_test_phase is null then
    raise exception 'Choose the Cyber T&E phase of a Cyber T&E campaign' using errcode = '23514';
  end if;
  if new.kind is distinct from 'cyber_test' and new.cyber_test_phase is not null then
    raise exception 'Only a Cyber T&E campaign names a Cyber T&E phase' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_campaign_kind() from public, anon, authenticated;
create or replace trigger a_campaign_kind before insert or update of kind, cyber_test_phase on public.assessment_campaigns
  for each row execute function public.guard_campaign_kind();
comment on function public.guard_campaign_kind() is 'A Cyber T&E campaign names its phase, and only a Cyber T&E campaign names one: refused in the reader''s words, ahead of the check constraint assessment_campaigns_cyber_test.';
