-- Support can be attached to an actual control narrative without inventing a
-- component contribution or a statement. Existing exact links remain unchanged.
alter table public.requirement_implementations
  add column implemented_requirement_id uuid,
  alter column component_contribution_id drop not null,
  add constraint requirement_implementation_control foreign key (tenant_id,implemented_requirement_id)
    references public.implemented_requirements(tenant_id,id),
  add constraint requirement_implementation_one_target check (num_nonnulls(implemented_requirement_id,component_contribution_id)=1),
  add constraint requirement_implementation_control_unique unique (tenant_id,requirement_revision_id,implemented_requirement_id);
comment on table public.requirement_implementations is 'Explicit requirement support for a control-level or component-level SSP narrative. A control mapping alone does not create an implementation claim.';

alter table public.implementation_evidence
  add column implemented_requirement_id uuid,
  add column component_contribution_id uuid,
  alter column implementation_statement_id drop not null,
  add constraint implementation_evidence_control foreign key (tenant_id,implemented_requirement_id)
    references public.implemented_requirements(tenant_id,id),
  add constraint implementation_evidence_component foreign key (tenant_id,component_contribution_id)
    references public.component_contributions(tenant_id,id),
  add constraint implementation_evidence_one_target check (num_nonnulls(implemented_requirement_id,implementation_statement_id,component_contribution_id)=1),
  add constraint implementation_evidence_control_unique unique (tenant_id,implemented_requirement_id,evidence_version_id),
  add constraint implementation_evidence_component_unique unique (tenant_id,component_contribution_id,evidence_version_id);
comment on table public.implementation_evidence is 'An exact published evidence version explicitly supporting one control, statement, or component narrative in an SSP.';

-- A single context guard covers the expanded targets, including the previous
-- target on moves/deletes, while exact evidence publication guards stay intact.
create function public.guard_ssp_support_link() returns trigger
language plpgsql security definer set search_path='' as $$
declare
  previous boolean;
  link_row jsonb;
  target_tenant uuid;
  target_ssp uuid;
  target_program uuid;
  requirement_program uuid;
  evidence_program uuid;
  plan_state text;
begin
  foreach previous in array array[true,false] loop
    if (previous and tg_op='INSERT') or (not previous and tg_op='DELETE') then continue; end if;
    if previous then link_row:=to_jsonb(old); else link_row:=to_jsonb(new); end if;
    target_tenant:=(link_row->>'tenant_id')::uuid;
    target_ssp:=null;
    if link_row->>'implemented_requirement_id' is not null then
      select ssp_revision_id into target_ssp from public.implemented_requirements
        where tenant_id=target_tenant and id=(link_row->>'implemented_requirement_id')::uuid;
    elsif link_row->>'implementation_statement_id' is not null then
      select ssp_revision_id into target_ssp from public.implementation_statements
        where tenant_id=target_tenant and id=(link_row->>'implementation_statement_id')::uuid;
    elsif link_row->>'component_contribution_id' is not null then
      select ssp_revision_id into target_ssp from public.component_contributions
        where tenant_id=target_tenant and id=(link_row->>'component_contribution_id')::uuid;
    end if;
    if target_ssp is null then
      raise exception 'Choose an available SSP narrative for this support link' using errcode='23514';
    end if;
    select sr.state,s.program_id into plan_state,target_program from public.ssp_revisions sr
      join public.systems s on s.tenant_id=sr.tenant_id and s.id=sr.system_id
      where sr.tenant_id=target_tenant and sr.id=target_ssp for share of sr;
    if plan_state='published' then
      raise exception 'Published SSP support links are immutable' using errcode='23514';
    end if;
    if tg_table_name='requirement_implementations' then
      select er.program_id into requirement_program from public.requirement_revisions rr
        join public.engineering_requirements er on er.tenant_id=rr.tenant_id and er.id=rr.engineering_requirement_id
        where rr.tenant_id=target_tenant and rr.id=(link_row->>'requirement_revision_id')::uuid;
      if requirement_program is distinct from target_program then
        raise exception 'The linked requirement must belong to the SSP program' using errcode='23514';
      end if;
    else
      select a.program_id into evidence_program from public.evidence_versions v
        join public.evidence_artifacts a on a.tenant_id=v.tenant_id and a.id=v.artifact_id
        where v.tenant_id=target_tenant and v.id=(link_row->>'evidence_version_id')::uuid;
      if not found then raise exception 'Choose evidence in this workspace' using errcode='23514'; end if;
      if evidence_program is not null and evidence_program<>target_program then
        raise exception 'Evidence must belong to the SSP program or be workspace-wide' using errcode='23514';
      end if;
    end if;
  end loop;
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function public.guard_ssp_support_link() from public,anon,authenticated;
drop trigger requirement_context on public.requirement_implementations;
create trigger a_ssp_support_context before insert or update or delete on public.requirement_implementations
  for each row execute function public.guard_ssp_support_link();
drop trigger published_document on public.implementation_evidence;
create trigger a_ssp_support_context before insert or update or delete on public.implementation_evidence
  for each row execute function public.guard_ssp_support_link();
