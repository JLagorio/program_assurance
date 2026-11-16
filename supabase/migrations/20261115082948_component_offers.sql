-- Component offers: what a program found on a shared component flows up to the component's owner,
-- is reviewed once, and then stands for everything built from that component version.
--
-- Slice 1 (20261115070043_component_assessments) gave a component set an owner and let a component
-- version be assessed once. Until now a program's own result on a shared component (an operational
-- issue, an assessor's determination) counted in that program alone, and nothing carried it to the
-- other consumers. This migration adds, and changes nothing that was there except that the Review
-- queue gains a kind:
--
--   component_owners         a named owner for one component of a set, over the set's own owner
--   component_offers         a program offers something it holds on a system component built from a
--   component_offer_items    library component to that component's owner: operational issues
--                            (kind finding) or assessment findings of its published results, each
--                            offering its determination on the control it judges (determinations)
--   component_offer_issues   once a finding is accepted, each program's own operational issue for
--                            it: the offering program's as the source, and one opened in every
--                            other program built from the same component version
--
-- Three commands write the offers, each answering a request id once: offer_to_component,
-- withdraw_component_offer and review_component_offer (accept, or return with a note). Clients read
-- the three offer tables and write none of them; a component's owner is written as a component
-- set's is, by any member who may write.
--
-- An offer is refused when the system component is built from no library component, when the
-- program declared its inherited element modified (the decision is an unmodified component), when
-- an item is not the offering program's, when a finding's results are still a draft, and when the
-- same item already waits in an offer for that component version or was accepted for it.
--
-- Accepting a finding leaves it standing on the component version: every other program that holds
-- a system component built from that version gets one operational issue of its own (title,
-- description and severity copied, open, nobody's yet), so each program answers its own row.
-- Accepting determinations publishes them, in the same transaction, as one component assessment of
-- that version against the offering system's control baseline, each determination citing its
-- assessment finding; component_standing_lines already takes the latest published determination a
-- control. Until an offer is accepted, the result counts in the offering program alone.
--
-- Reads: component_offer_rows is the offers' register, one row an offer; review_queue_rows lists an
-- offer still offered as the kind component_offer, waiting on the component's effective owner;
-- component_rows, component_control_status, component_consumers and system_upstream answer the
-- effective owner (the component's own, else its set's), and the last two gain, as new keys, the
-- open findings that stand on each component version and how many offers wait. component_rows
-- gains offers_open as its last column.
--
-- Every statement here can run again.

-- ---------------------------------------------------------------------------------------------
-- A named owner for one component of a set.
--
-- A component has no identity of its own across the versions of its definition: it is followed by
-- its name, so its owner is named for that name inside the definition. A component with no row of
-- its own is owned by its set's owner (component_definitions.owner_party_id), which is where every
-- component starts; naming another party here hands it on.
-- ---------------------------------------------------------------------------------------------
create table if not exists public.component_owners (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  component_definition_id uuid not null,
  component_name text not null check (length(btrim(component_name)) > 0),
  owner_party_id uuid not null,
  unique (tenant_id, id),
  unique (tenant_id, component_definition_id, component_name),
  foreign key (tenant_id, component_definition_id)
    references public.component_definitions(tenant_id, id) on delete cascade,
  foreign key (tenant_id, owner_party_id) references public.parties(tenant_id, id)
);
create index if not exists component_owners_owner_idx on public.component_owners(tenant_id, owner_party_id);

-- What the foreign keys cannot say: the name is a component of some version of the definition.
create or replace function public.guard_component_owner() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.defined_components c
    join public.component_definition_revisions r
      on r.tenant_id = c.tenant_id and r.id = c.component_definition_revision_id
    where r.tenant_id = new.tenant_id and r.component_definition_id = new.component_definition_id
      and c.name = new.component_name) then
    raise exception 'Name an owner for a component of a version of this component set' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_component_owner() from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_catalog.pg_policies
    where schemaname = 'public' and tablename = 'component_owners' and policyname = 'tenant_read') then
    perform public.apply_tenant_security('component_owners');
  end if;
  if not exists (select 1 from pg_catalog.pg_trigger
    where tgrelid = 'public.component_owners'::regclass and tgname = 'record_lifecycle' and not tgisinternal) then
    perform public.attach_record_lifecycle('component_owners', false);
  end if;
end $$;
create or replace trigger stable_context before update on public.component_owners
  for each row execute function public.guard_stable_assurance_context('component_definition_id', 'component_name');
create or replace trigger a_component_owner before insert on public.component_owners
  for each row execute function public.guard_component_owner();

comment on table public.component_owners is 'A named owner for one component of a component set, followed across the set''s versions by its name. A component with no row here is owned by its set''s owner (component_definitions.owner_party_id); changing the party hands the component on.';
comment on column public.component_owners.component_name is 'The component, by the name it has in the versions of its definition.';
comment on column public.component_owners.owner_party_id is 'The person or organization that answers for this component across everything built from it.';

-- Internal: who answers for a component version. Its own owner, else its set's.
create or replace function public.component_owner_party(p_defined_component_id uuid) returns uuid
language sql stable security invoker set search_path = '' as $$
  select coalesce(o.owner_party_id, d.owner_party_id)
  from public.defined_components c
  join public.component_definition_revisions r
    on r.tenant_id = c.tenant_id and r.id = c.component_definition_revision_id
  join public.component_definitions d on d.tenant_id = r.tenant_id and d.id = r.component_definition_id
  left join public.component_owners o
    on o.tenant_id = d.tenant_id and o.component_definition_id = d.id and o.component_name = c.name
  where c.id = p_defined_component_id
$$;
revoke all on function public.component_owner_party(uuid) from public, anon;
grant execute on function public.component_owner_party(uuid) to authenticated;
comment on function public.component_owner_party(uuid) is 'Internal: the effective owner of a component version, the party named for the component in component_owners, else its component set''s owner; null while nobody is named. Security invoker.';

-- ---------------------------------------------------------------------------------------------
-- Offers: a program offers what it holds on a shared component to the component's owner.
-- ---------------------------------------------------------------------------------------------
create table if not exists public.component_offers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  defined_component_id uuid not null,
  program_id uuid not null,
  system_id uuid not null,
  system_component_id uuid not null,
  kind text not null check (kind in ('finding', 'determinations')),
  title text not null check (length(btrim(title)) > 0),
  note text,
  offered_by_party_id uuid,
  offered_at timestamptz not null default now(),
  state text not null default 'offered' check (state in ('offered', 'accepted', 'returned', 'withdrawn')),
  reviewed_by_party_id uuid,
  reviewed_at timestamptz,
  review_note text,
  withdrawn_by_party_id uuid,
  withdrawn_at timestamptz,
  component_assessment_id uuid,
  constraint component_offers_reviewed check ((state = 'accepted' or state = 'returned') = (reviewed_at is not null)),
  constraint component_offers_withdrawn check ((state = 'withdrawn') = (withdrawn_at is not null)),
  constraint component_offers_return_note check (state <> 'returned' or length(btrim(coalesce(review_note, ''))) > 0),
  constraint component_offers_order check (
    (reviewed_at is null or reviewed_at >= offered_at) and (withdrawn_at is null or withdrawn_at >= offered_at)),
  constraint component_offers_published check (
    component_assessment_id is null or (kind = 'determinations' and state = 'accepted')),
  unique (tenant_id, id),
  unique (tenant_id, id, program_id),
  foreign key (tenant_id, defined_component_id) references public.defined_components(tenant_id, id),
  foreign key (tenant_id, program_id, system_id) references public.systems(tenant_id, program_id, id),
  foreign key (tenant_id, system_id, system_component_id) references public.system_components(tenant_id, system_id, id),
  foreign key (tenant_id, offered_by_party_id) references public.parties(tenant_id, id),
  foreign key (tenant_id, reviewed_by_party_id) references public.parties(tenant_id, id),
  foreign key (tenant_id, withdrawn_by_party_id) references public.parties(tenant_id, id),
  foreign key (tenant_id, component_assessment_id) references public.component_assessments(tenant_id, id)
);
-- An item is an operational issue of the offering program (kind finding) or an assessment finding
-- of its published results (kind determinations), with the control that finding judges.
create table if not exists public.component_offer_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  component_offer_id uuid not null,
  program_id uuid not null,
  issue_id uuid,
  assessment_finding_id uuid,
  control_id uuid references public.controls(id),
  -- One or the other. No client writes an item, so it is no target group of the generic forms.
  constraint component_offer_items_target check ((issue_id is null) <> (assessment_finding_id is null)),
  constraint component_offer_items_control check ((assessment_finding_id is not null) = (control_id is not null)),
  unique (tenant_id, id),
  unique (tenant_id, component_offer_id, issue_id),
  unique (tenant_id, component_offer_id, assessment_finding_id),
  -- One finding a control: an accepted offer publishes one determination for each.
  unique (tenant_id, component_offer_id, control_id),
  foreign key (tenant_id, component_offer_id, program_id)
    references public.component_offers(tenant_id, id, program_id) on delete cascade,
  foreign key (tenant_id, program_id, issue_id) references public.operational_issues(tenant_id, program_id, id),
  foreign key (tenant_id, assessment_finding_id) references public.assessment_findings(tenant_id, id)
);
-- Once a finding is accepted: each program's own operational issue for it. The offering program's
-- is the source; every other is the row a consumer answers.
create table if not exists public.component_offer_issues (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  component_offer_id uuid not null,
  component_offer_item_id uuid not null,
  program_id uuid not null,
  issue_id uuid not null,
  system_component_id uuid,
  source boolean not null default false,
  unique (tenant_id, id),
  unique (tenant_id, component_offer_item_id, program_id),
  unique (tenant_id, component_offer_item_id, issue_id),
  foreign key (tenant_id, component_offer_id) references public.component_offers(tenant_id, id) on delete cascade,
  foreign key (tenant_id, component_offer_item_id) references public.component_offer_items(tenant_id, id) on delete cascade,
  foreign key (tenant_id, program_id, issue_id) references public.operational_issues(tenant_id, program_id, id),
  foreign key (tenant_id, system_component_id) references public.system_components(tenant_id, id)
);
create index if not exists component_offers_tenant_idx on public.component_offers(tenant_id);
create index if not exists component_offers_component_idx on public.component_offers(tenant_id, defined_component_id, state);
create index if not exists component_offers_program_idx on public.component_offers(tenant_id, program_id);
create index if not exists component_offer_items_tenant_idx on public.component_offer_items(tenant_id);
create index if not exists component_offer_items_offer_idx on public.component_offer_items(tenant_id, component_offer_id);
create index if not exists component_offer_items_issue_idx on public.component_offer_items(tenant_id, issue_id);
create index if not exists component_offer_items_finding_idx on public.component_offer_items(tenant_id, assessment_finding_id);
create index if not exists component_offer_issues_tenant_idx on public.component_offer_issues(tenant_id);
create index if not exists component_offer_issues_offer_idx on public.component_offer_issues(tenant_id, component_offer_id);
create index if not exists component_offer_issues_issue_idx on public.component_offer_issues(tenant_id, issue_id);

-- What the foreign keys cannot say of an offer: its system component is built from the component
-- version it names, on an element the program did not declare modified; and once it is reviewed or
-- withdrawn it no longer changes.
create or replace function public.guard_component_offer() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_component public.system_components; v_kinds text[];
begin
  if tg_op = 'UPDATE' then
    if old.state <> 'offered' then
      raise exception 'An offer that was reviewed or withdrawn no longer changes' using errcode = '23514';
    end if;
    return new;
  end if;
  select * into v_component from public.system_components c
    where c.tenant_id = new.tenant_id and c.system_id = new.system_id and c.id = new.system_component_id;
  -- A component that is not there is refused by the foreign key.
  if v_component.id is null then
    return new;
  end if;
  if v_component.defined_component_id is null then
    raise exception 'This component is built from no library component, so it has no owner to offer to' using errcode = '23514';
  end if;
  if v_component.defined_component_id is distinct from new.defined_component_id then
    raise exception 'An offer names the component version its system component is built from' using errcode = '23514';
  end if;
  -- The element the component sits on, as the reads find it: the one it names, else the one a
  -- single inventory relationship gives it, else its system.
  select e.product_change_kinds into v_kinds
    from public.system_component_element_links k
    join public.systems e on e.tenant_id = k.tenant_id and e.id = coalesce(k.system_element_id, k.system_id)
    where k.tenant_id = new.tenant_id and k.id = new.system_component_id;
  if v_kinds is not null then
    raise exception 'The program declared this component''s element modified. Only a result on an unmodified component is offered to its owner.' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_component_offer() from public, anon, authenticated;

-- What they cannot say of an item: it matches its offer's kind; a finding is one of the offering
-- program's, of published results, with a determination on a control; and the same item neither
-- waits in another offer for that component version nor was accepted for it.
create or replace function public.guard_component_offer_item() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_offer public.component_offers;
  v_finding record;
  v_other text;
begin
  select * into v_offer from public.component_offers o
    where o.tenant_id = new.tenant_id and o.id = new.component_offer_id for share;
  -- An offer that is not there is refused by the foreign key.
  if v_offer.id is null then
    return new;
  end if;
  if v_offer.state <> 'offered' then
    raise exception 'An offer that was reviewed or withdrawn takes no more items' using errcode = '23514';
  end if;
  if (v_offer.kind = 'finding') <> (new.issue_id is not null) then
    raise exception 'An offer of a finding holds operational issues, and an offer of determinations assessment findings' using errcode = '23514';
  end if;
  if new.assessment_finding_id is not null then
    select f.determination, part.control_id, results.state, campaign.program_id into v_finding
      from public.assessment_findings f
      join public.assessment_results_revisions results
        on results.tenant_id = f.tenant_id and results.id = f.assessment_results_revision_id
      join public.assessment_plan_revisions plan
        on plan.tenant_id = results.tenant_id and plan.id = results.assessment_plan_revision_id
      join public.assessment_campaigns campaign
        on campaign.tenant_id = plan.tenant_id and campaign.id = plan.campaign_id
      left join public.control_parts part on part.id = f.target_control_part_id
      where f.tenant_id = new.tenant_id and f.id = new.assessment_finding_id;
    if v_finding.program_id is distinct from v_offer.program_id then
      raise exception 'Offer assessment findings of the program that holds the component' using errcode = '23514';
    end if;
    if v_finding.state <> 'published' then
      raise exception 'Offer a finding of published assessment results. Draft results decide nothing yet.' using errcode = '23514';
    end if;
    if v_finding.determination not in ('satisfied', 'partially_satisfied', 'other_than_satisfied')
      or v_finding.control_id is null then
      raise exception 'Offer a finding that reached a determination on a control' using errcode = '23514';
    end if;
    new.control_id := v_finding.control_id;
  else
    new.control_id := null;
  end if;
  select o.state into v_other
    from public.component_offer_items i
    join public.component_offers o on o.tenant_id = i.tenant_id and o.id = i.component_offer_id
    where i.tenant_id = new.tenant_id and o.defined_component_id = v_offer.defined_component_id
      and o.id <> v_offer.id and o.state in ('offered', 'accepted')
      and (i.issue_id = new.issue_id or i.assessment_finding_id = new.assessment_finding_id)
    order by (o.state = 'offered') desc limit 1;
  if v_other = 'offered' then
    raise exception 'This % already waits in an offer to the component''s owner',
      case when new.issue_id is not null then 'operational issue' else 'assessment finding' end using errcode = '23505';
  elsif v_other = 'accepted' then
    raise exception 'This % was already accepted for this component version',
      case when new.issue_id is not null then 'operational issue' else 'assessment finding' end using errcode = '23505';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_component_offer_item() from public, anon, authenticated;

-- Clients read the offers and write none of them: the three commands do.
alter table public.component_offers enable row level security;
alter table public.component_offer_items enable row level security;
alter table public.component_offer_issues enable row level security;
revoke all on public.component_offers, public.component_offer_items, public.component_offer_issues from public, anon, authenticated;
grant select on public.component_offers, public.component_offer_items, public.component_offer_issues to authenticated;
do $$
declare v_table text;
begin
  foreach v_table in array array['component_offers', 'component_offer_items', 'component_offer_issues'] loop
    if not exists (select 1 from pg_catalog.pg_policies
      where schemaname = 'public' and tablename = v_table and policyname = 'tenant_read') then
      execute format('create policy tenant_read on public.%I for select to authenticated using (public.can_read_tenant(tenant_id))', v_table);
    end if;
    if not exists (select 1 from pg_catalog.pg_trigger
      where tgrelid = ('public.' || v_table)::regclass and tgname = 'record_lifecycle' and not tgisinternal) then
      perform public.attach_record_lifecycle(v_table, false);
    end if;
  end loop;
  if not exists (select 1 from pg_catalog.pg_trigger
    where tgrelid = 'public.component_offer_items'::regclass and tgname = 'reference_tenant_control_id' and not tgisinternal) then
    perform public.attach_reference_tenant_guard('component_offer_items', 'control_id', 'controls');
  end if;
end $$;
create or replace trigger stable_context before update on public.component_offers
  for each row execute function public.guard_stable_assurance_context(
    'defined_component_id', 'program_id', 'system_id', 'system_component_id', 'kind');
create or replace trigger a_component_offer before insert or update on public.component_offers
  for each row execute function public.guard_component_offer();
create or replace trigger a_component_offer_item before insert on public.component_offer_items
  for each row execute function public.guard_component_offer_item();

comment on table public.component_offers is 'A program''s offer of something it holds on a system component built from a library component to that component''s owner: operational issues (kind finding) or the determinations of assessment findings of its published results (kind determinations). It waits (offered) until the owner''s side accepts or returns it, or the offering side withdraws it. Accepted, a finding stands on the component version for every consumer and determinations are published as a component assessment. Written by offer_to_component, withdraw_component_offer and review_component_offer only.';
comment on column public.component_offers.defined_component_id is 'The component version the result was found on: the library component the system component is built from.';
comment on column public.component_offers.system_component_id is 'The offering program''s system component, built from the component version, on an element the program did not declare modified.';
comment on column public.component_offers.state is 'offered while it waits on the component''s owner; accepted or returned once reviewed; withdrawn by the offering side.';
comment on column public.component_offers.review_note is 'What the reviewer said; required when the offer is returned.';
comment on column public.component_offers.component_assessment_id is 'The component assessment an accepted offer of determinations was published as.';
comment on table public.component_offer_items is 'What an offer holds: an operational issue of the offering program, or an assessment finding of its published results with the control it judges (one finding a control). Written by offer_to_component only.';
comment on table public.component_offer_issues is 'Each program''s own operational issue for an accepted finding: the offering program''s as the source, and the one review_component_offer opened in every other program that holds a system component built from the same component version. A program answers its own row. Written by review_component_offer only.';
comment on column public.component_offer_issues.system_component_id is 'The program''s system component built from the component version: the offer''s for the source, the first by code for a consumer.';

-- ---------------------------------------------------------------------------------------------
-- Receipts: what each request first answered, for the three commands.
-- ---------------------------------------------------------------------------------------------
create table if not exists public.component_offer_requests (
  id uuid primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  component_offer_id uuid not null,
  command text not null check (command in ('offer', 'withdraw', 'review')),
  request jsonb not null check (jsonb_typeof(request) = 'object'),
  result jsonb not null check (jsonb_typeof(result) = 'object'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  -- A receipt goes with its offer, so it never keeps one from being removed.
  foreign key (tenant_id, component_offer_id) references public.component_offers(tenant_id, id) on delete cascade
);
create index if not exists component_offer_requests_offer_idx on public.component_offer_requests(tenant_id, component_offer_id);
alter table public.component_offer_requests enable row level security;
revoke all on public.component_offer_requests from public, anon, authenticated;
comment on table public.component_offer_requests is 'Private receipts of offer_to_component, withdraw_component_offer and review_component_offer: a request sent again returns what it first answered, and one sent for another choice conflicts. No client reads them.';

-- ---------------------------------------------------------------------------------------------
-- Internal: the words and the activity event of an offer.
-- ---------------------------------------------------------------------------------------------
-- What an offer holds, in the words an activity entry reads: "a finding", "3 determinations".
create or replace function public.component_offer_words(p_kind text, p_items bigint) returns text
language sql immutable set search_path = '' as $$
  select case
    when p_kind = 'finding' and p_items = 1 then 'a finding'
    when p_kind = 'finding' then p_items::text || ' findings'
    when p_items = 1 then 'a determination'
    else p_items::text || ' determinations' end
$$;
revoke all on function public.component_offer_words(text, bigint) from public, anon, authenticated;

-- One activity event of the offering program about its offer, in the feeds' shape: the deed after
-- the person, then what was said. It names the program and the record an entry links to: the first
-- operational issue offered, or the campaign of the first assessment finding offered.
create or replace function public.record_component_offer_event(
  p_offer public.component_offers, p_actor_party_id uuid, p_event_type text, p_deed text, p_said text, p_at timestamptz
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_issue uuid; v_campaign uuid; v_event uuid;
begin
  if p_offer.kind = 'finding' then
    select i.issue_id into v_issue
      from public.component_offer_items i
      join public.operational_issues o on o.tenant_id = i.tenant_id and o.id = i.issue_id
      where i.tenant_id = p_offer.tenant_id and i.component_offer_id = p_offer.id
      order by o.opened_at nulls last, o.title, i.id limit 1;
  else
    select plan.campaign_id into v_campaign
      from public.component_offer_items i
      join public.assessment_findings f on f.tenant_id = i.tenant_id and f.id = i.assessment_finding_id
      join public.assessment_results_revisions results
        on results.tenant_id = f.tenant_id and results.id = f.assessment_results_revision_id
      join public.assessment_plan_revisions plan
        on plan.tenant_id = results.tenant_id and plan.id = results.assessment_plan_revision_id
      where i.tenant_id = p_offer.tenant_id and i.component_offer_id = p_offer.id
      order by f.determined_at nulls last, f.title, i.id limit 1;
  end if;
  insert into public.activity_events (tenant_id, program_id, issue_id, assessment_campaign_id, actor_party_id,
      event_type, description, occurred_at)
    values (p_offer.tenant_id, p_offer.program_id, v_issue, v_campaign, p_actor_party_id, p_event_type,
      p_deed || E'\n' || p_said, p_at)
    returning id into v_event;
  return v_event;
end;
$$;
revoke all on function public.record_component_offer_event(public.component_offers, uuid, text, text, text, timestamptz) from public, anon, authenticated;
comment on function public.record_component_offer_event(public.component_offers, uuid, text, text, text, timestamptz) is 'Internal: writes one activity event of the offering program about its offer (the deed after the person, then what was said), naming the program and the first operational issue offered, or the campaign of the first assessment finding offered. The three offer commands call it.';

-- ---------------------------------------------------------------------------------------------
-- Offer something a program holds on a shared component to the component's owner.
--
-- The offer names the system component, and through it the component version, the system and the
-- program. Its items are operational issues of that program (kind finding) or assessment findings
-- of its published results (kind determinations), all of them or none. It asserts the result was
-- found on this component; the owner's review is the check. Each request is answered once: the
-- same request sent again returns its first answer and writes nothing, and its id sent with
-- another choice is refused.
-- ---------------------------------------------------------------------------------------------
create or replace function public.offer_to_component(
  p_tenant_id uuid,
  p_system_component_id uuid,
  p_kind text,
  p_item_ids uuid[],
  p_title text,
  p_note text,
  p_request_id uuid
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_receipt public.component_offer_requests;
  v_request jsonb;
  v_items uuid[];
  v_title text := nullif(regexp_replace(btrim(coalesce(p_title, '')), '\s+', ' ', 'g'), '');
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_component public.system_components;
  v_system public.systems;
  v_defined record;
  v_party uuid; v_owner uuid; v_owner_name text; v_twice text;
  v_offer public.component_offers;
  v_event uuid;
  v_result jsonb;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then
    raise exception 'An editor, admin, or owner can offer a result to a component''s owner' using errcode = '42501';
  end if;
  if p_system_component_id is null or p_request_id is null then
    raise exception 'Choose the component and what to offer its owner' using errcode = '22023';
  end if;
  if p_kind is null or p_kind not in ('finding', 'determinations') then
    raise exception 'An offer holds a finding or determinations' using errcode = '22023';
  end if;
  select coalesce(array_agg(distinct i order by i), '{}') into v_items
    from unnest(coalesce(p_item_ids, '{}')) i where i is not null;
  if cardinality(v_items) not between 1 and 200 then
    raise exception 'Choose between 1 and 200 % to offer',
      case when p_kind = 'finding' then 'operational issues' else 'assessment findings' end using errcode = '22023';
  end if;
  v_request := jsonb_build_object('systemComponentId', p_system_component_id, 'kind', p_kind, 'items', to_jsonb(v_items));
  -- One answer per request: the same request sent again answers as it first did.
  perform pg_advisory_xact_lock(hashtextextended('component-offer/' || p_request_id::text, 0));
  select * into v_receipt from public.component_offer_requests r where r.id = p_request_id;
  if found then
    if v_receipt.tenant_id <> p_tenant_id or v_receipt.command <> 'offer' or v_receipt.request <> v_request then
      raise exception 'This request already made another offer. Make this offer again.' using errcode = 'PT409';
    end if;
    return v_receipt.result;
  end if;
  select * into v_component from public.system_components c
    where c.tenant_id = p_tenant_id and c.id = p_system_component_id;
  if v_component.id is null then
    raise exception 'This component is no longer available; reload and try again' using errcode = 'PT404';
  end if;
  if v_component.defined_component_id is null then
    raise exception 'This component is built from no library component, so it has no owner to offer to' using errcode = '23514';
  end if;
  select * into v_system from public.systems s where s.tenant_id = p_tenant_id and s.id = v_component.system_id;
  -- Offers for one component version wait their turn, so the same item is never offered twice.
  perform pg_advisory_xact_lock(hashtextextended('component-offers/' || v_component.defined_component_id::text, 0));
  if p_kind = 'finding' then
    if exists (select 1 from unnest(v_items) i where not exists (select 1 from public.operational_issues o
      where o.tenant_id = p_tenant_id and o.program_id = v_system.program_id and o.id = i)) then
      raise exception 'Offer operational issues of the program that holds the component' using errcode = '23514';
    end if;
    v_title := coalesce(v_title, (select regexp_replace(btrim(o.title), '\s+', ' ', 'g') from public.operational_issues o
      where o.tenant_id = p_tenant_id and o.id = any(v_items) order by o.opened_at nulls last, o.title, o.id limit 1));
  else
    if exists (select 1 from unnest(v_items) i where not exists (select 1 from public.assessment_findings f
      where f.tenant_id = p_tenant_id and f.id = i)) then
      raise exception 'Offer assessment findings of the program that holds the component' using errcode = '23514';
    end if;
    -- One finding a control: an accepted offer publishes one determination for each.
    select k.code into v_twice
      from public.assessment_findings f
      join public.control_parts part on part.id = f.target_control_part_id
      join public.controls k on k.id = part.control_id
      where f.tenant_id = p_tenant_id and f.id = any(v_items)
      group by k.id, k.code having count(*) > 1
      order by public.natural_sort_key(k.code) collate "C" limit 1;
    if v_twice is not null then
      raise exception 'More than one of the findings offered judges %. Offer one finding a control.', v_twice using errcode = '23514';
    end if;
    v_title := coalesce(v_title, (select regexp_replace(btrim(f.title), '\s+', ' ', 'g') from public.assessment_findings f
      where f.tenant_id = p_tenant_id and f.id = any(v_items) order by f.determined_at nulls last, f.title, f.id limit 1));
  end if;
  select c.name, r.version_number, d.name as definition_name into v_defined
    from public.defined_components c
    join public.component_definition_revisions r
      on r.tenant_id = c.tenant_id and r.id = c.component_definition_revision_id
    join public.component_definitions d on d.tenant_id = r.tenant_id and d.id = r.component_definition_id
    where c.tenant_id = p_tenant_id and c.id = v_component.defined_component_id;
  select p.id into v_party from public.parties p
    where p.tenant_id = p_tenant_id and p.auth_user_id = auth.uid();
  -- The guards refuse a component on an element the program declared modified, a finding that is
  -- not the program's or whose results are a draft, and an item already offered or accepted.
  insert into public.component_offers (tenant_id, defined_component_id, program_id, system_id, system_component_id,
      kind, title, note, offered_by_party_id)
    values (p_tenant_id, v_component.defined_component_id, v_system.program_id, v_system.id, v_component.id,
      p_kind, v_title, v_note, v_party)
    returning * into v_offer;
  insert into public.component_offer_items (tenant_id, component_offer_id, program_id, issue_id, assessment_finding_id)
    select p_tenant_id, v_offer.id, v_offer.program_id,
      case when p_kind = 'finding' then i end, case when p_kind = 'determinations' then i end
    from unnest(v_items) i;
  v_owner := public.component_owner_party(v_offer.defined_component_id);
  select p.name into v_owner_name from public.parties p where p.tenant_id = p_tenant_id and p.id = v_owner;
  v_event := public.record_component_offer_event(v_offer, v_party, 'created',
    format('offered %s on %s to %s', public.component_offer_words(p_kind, cardinality(v_items)),
      regexp_replace(btrim(v_defined.name), '\s+', ' ', 'g'),
      coalesce(regexp_replace(btrim(v_owner_name), '\s+', ' ', 'g'), 'its owner')),
    format('%s: found on version %s of %s.', v_offer.title, v_defined.version_number,
      regexp_replace(btrim(v_defined.definition_name), '\s+', ' ', 'g')),
    v_offer.offered_at);
  v_result := jsonb_build_object(
    'offerId', v_offer.id,
    'kind', v_offer.kind,
    'state', v_offer.state,
    'revision', v_offer.revision,
    'items', cardinality(v_items),
    'definedComponentId', v_offer.defined_component_id,
    'programId', v_offer.program_id,
    'systemComponentId', v_offer.system_component_id,
    'waitingOnPartyId', v_owner,
    'offeredAt', v_offer.offered_at,
    'activityEventId', v_event);
  insert into public.component_offer_requests (id, tenant_id, component_offer_id, command, request, result, created_by)
    values (p_request_id, p_tenant_id, v_offer.id, 'offer', v_request, v_result, auth.uid());
  return v_result;
end;
$$;
revoke all on function public.offer_to_component(uuid, uuid, text, uuid[], text, text, uuid) from public, anon;
grant execute on function public.offer_to_component(uuid, uuid, text, uuid[], text, text, uuid) to authenticated;
comment on function public.offer_to_component(uuid, uuid, text, uuid[], text, text, uuid) is 'Offer something a program holds on a system component built from a library component to that component''s owner, in one transaction: operational issues of the program (kind finding) or assessment findings of its published results, each offering its determination on the control it judges (kind determinations). Refused: a component built from no library component or on an element the program declared modified, an item that is not the program''s, a finding of draft results or with no determination, two findings on one control, an item that already waits in an offer for that component version or was accepted for it, and a caller who may not write to the workspace. Writes one activity event for the program. The request id is chosen once per offer: the same request sent again returns its first answer.';

-- ---------------------------------------------------------------------------------------------
-- Withdraw an offer that still waits, at the revision the reader saw.
-- ---------------------------------------------------------------------------------------------
create or replace function public.withdraw_component_offer(
  p_tenant_id uuid, p_offer_id uuid, p_expected_revision bigint, p_request_id uuid
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_receipt public.component_offer_requests;
  v_request jsonb;
  v_offer public.component_offers;
  v_party uuid; v_name text; v_items bigint; v_event uuid;
  v_result jsonb;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then
    raise exception 'An editor, admin, or owner can withdraw an offer' using errcode = '42501';
  end if;
  if p_offer_id is null or p_request_id is null or p_expected_revision is null then
    raise exception 'Choose the offer to withdraw, at the revision you read' using errcode = '22023';
  end if;
  v_request := jsonb_build_object('offerId', p_offer_id);
  perform pg_advisory_xact_lock(hashtextextended('component-offer/' || p_request_id::text, 0));
  select * into v_receipt from public.component_offer_requests r where r.id = p_request_id;
  if found then
    if v_receipt.tenant_id <> p_tenant_id or v_receipt.command <> 'withdraw' or v_receipt.request <> v_request then
      raise exception 'This request already answered another offer. Withdraw this offer again.' using errcode = 'PT409';
    end if;
    return v_receipt.result;
  end if;
  select * into v_offer from public.component_offers o
    where o.tenant_id = p_tenant_id and o.id = p_offer_id for update;
  if v_offer.id is null then
    raise exception 'This offer is no longer available; reload and try again' using errcode = 'PT404';
  end if;
  if v_offer.state <> 'offered' then
    raise exception 'This offer was already %. Reload to see it.', v_offer.state using errcode = '23514';
  end if;
  if v_offer.revision is distinct from p_expected_revision then
    raise exception 'This offer changed since you read it. Reload it before withdrawing.' using errcode = 'PT409';
  end if;
  select p.id into v_party from public.parties p
    where p.tenant_id = p_tenant_id and p.auth_user_id = auth.uid();
  update public.component_offers
    set state = 'withdrawn', withdrawn_at = now(), withdrawn_by_party_id = v_party, revision = revision + 1
    where tenant_id = p_tenant_id and id = p_offer_id
    returning * into v_offer;
  select regexp_replace(btrim(c.name), '\s+', ' ', 'g') into v_name from public.defined_components c
    where c.tenant_id = p_tenant_id and c.id = v_offer.defined_component_id;
  select count(*) into v_items from public.component_offer_items i
    where i.tenant_id = p_tenant_id and i.component_offer_id = v_offer.id;
  v_event := public.record_component_offer_event(v_offer, v_party, 'updated',
    format('withdrew the offer of %s on %s', public.component_offer_words(v_offer.kind, v_items), v_name),
    format('%s.', v_offer.title), v_offer.withdrawn_at);
  v_result := jsonb_build_object(
    'offerId', v_offer.id,
    'state', v_offer.state,
    'revision', v_offer.revision,
    'withdrawnAt', v_offer.withdrawn_at,
    'activityEventId', v_event);
  insert into public.component_offer_requests (id, tenant_id, component_offer_id, command, request, result, created_by)
    values (p_request_id, p_tenant_id, v_offer.id, 'withdraw', v_request, v_result, auth.uid());
  return v_result;
end;
$$;
revoke all on function public.withdraw_component_offer(uuid, uuid, bigint, uuid) from public, anon;
grant execute on function public.withdraw_component_offer(uuid, uuid, bigint, uuid) to authenticated;
comment on function public.withdraw_component_offer(uuid, uuid, bigint, uuid) is 'Withdraw an offer that still waits on the component''s owner, at the revision the reader saw: it leaves the Review queue and its items can be offered again. An offer already reviewed or withdrawn, changed since it was read or not in the workspace is refused, as is a caller who may not write to the workspace. Writes one activity event for the offering program. The same request sent again returns its first answer.';

-- ---------------------------------------------------------------------------------------------
-- Review an offer: accept it, or return it with a note.
--
-- Accepted, a finding stands on the component version: the offering program's operational issue is
-- its source, and every other program that holds a system component built from the same component
-- version gets one operational issue of its own for each issue offered (title, description and
-- severity copied, open, nobody's, opened now), with one activity event a program. A program that
-- already holds an issue for the item is passed over. Accepted, determinations are published as
-- one component assessment of that component version against the offering system's control
-- baseline, each determination citing its assessment finding, so they stand for every consumer
-- from then on. Either way the offering program's activity says the offer was reviewed.
-- ---------------------------------------------------------------------------------------------
create or replace function public.review_component_offer(
  p_tenant_id uuid,
  p_offer_id uuid,
  p_expected_revision bigint,
  p_decision text,
  p_note text,
  p_request_id uuid
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_receipt public.component_offer_requests;
  v_request jsonb;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_offer public.component_offers;
  v_defined record;
  v_source record;
  v_party uuid;
  v_now timestamptz := now();
  v_items bigint;
  v_consumer record; v_item record;
  v_issue uuid; v_first uuid; v_opened integer;
  v_issues jsonb := '[]'; v_programs integer := 0; v_skipped integer := 0;
  v_baseline uuid; v_outside text[]; v_assessment uuid; v_determinations integer := 0;
  v_event uuid;
  v_result jsonb;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then
    raise exception 'An editor, admin, or owner can review an offer' using errcode = '42501';
  end if;
  if p_offer_id is null or p_request_id is null or p_expected_revision is null then
    raise exception 'Choose the offer to review, at the revision you read' using errcode = '22023';
  end if;
  if p_decision is null or p_decision not in ('accepted', 'returned') then
    raise exception 'Accept the offer or return it' using errcode = '22023';
  end if;
  if p_decision = 'returned' and v_note is null then
    raise exception 'Say why the offer is returned' using errcode = '22023';
  end if;
  v_request := jsonb_build_object('offerId', p_offer_id, 'decision', p_decision);
  perform pg_advisory_xact_lock(hashtextextended('component-offer/' || p_request_id::text, 0));
  select * into v_receipt from public.component_offer_requests r where r.id = p_request_id;
  if found then
    if v_receipt.tenant_id <> p_tenant_id or v_receipt.command <> 'review' or v_receipt.request <> v_request then
      raise exception 'This request already answered another offer. Review this offer again.' using errcode = 'PT409';
    end if;
    return v_receipt.result;
  end if;
  select * into v_offer from public.component_offers o
    where o.tenant_id = p_tenant_id and o.id = p_offer_id for update;
  if v_offer.id is null then
    raise exception 'This offer is no longer available; reload and try again' using errcode = 'PT404';
  end if;
  if v_offer.state <> 'offered' then
    raise exception 'This offer was already %. Reload to see it.', v_offer.state using errcode = '23514';
  end if;
  if v_offer.revision is distinct from p_expected_revision then
    raise exception 'This offer changed since you read it. Reload it before reviewing.' using errcode = 'PT409';
  end if;
  select regexp_replace(btrim(c.name), '\s+', ' ', 'g') as name, c.component_definition_revision_id as revision_id,
      r.version_number
    into v_defined
    from public.defined_components c
    join public.component_definition_revisions r
      on r.tenant_id = c.tenant_id and r.id = c.component_definition_revision_id
    where c.tenant_id = p_tenant_id and c.id = v_offer.defined_component_id;
  select g.code as program_code, s.code as system_code into v_source
    from public.systems s join public.programs g on g.tenant_id = s.tenant_id and g.id = s.program_id
    where s.tenant_id = p_tenant_id and s.id = v_offer.system_id;
  select p.id into v_party from public.parties p
    where p.tenant_id = p_tenant_id and p.auth_user_id = auth.uid();
  select count(*) into v_items from public.component_offer_items i
    where i.tenant_id = p_tenant_id and i.component_offer_id = v_offer.id;

  if p_decision = 'accepted' and v_offer.kind = 'finding' then
    -- The offering program's issues are the source of what now stands on the component version.
    insert into public.component_offer_issues (tenant_id, component_offer_id, component_offer_item_id, program_id,
        issue_id, system_component_id, source)
      select p_tenant_id, v_offer.id, i.id, v_offer.program_id, i.issue_id, v_offer.system_component_id, true
      from public.component_offer_items i
      where i.tenant_id = p_tenant_id and i.component_offer_id = v_offer.id
      on conflict do nothing;
    -- Every program that holds a system component built from the same component version, each
    -- once, with its first such component by code.
    for v_consumer in
      select b.program_id,
        (array_agg(c.id order by public.natural_sort_key(c.code) collate "C", c.id))[1] as system_component_id
      from public.system_components c
      join public.systems b on b.tenant_id = c.tenant_id and b.id = c.system_id
      where c.tenant_id = p_tenant_id and c.defined_component_id = v_offer.defined_component_id
      group by b.program_id
      order by b.program_id
    loop
      v_first := null; v_opened := 0;
      for v_item in
        select i.id, o.title, o.description, o.severity
        from public.component_offer_items i
        join public.operational_issues o on o.tenant_id = i.tenant_id and o.id = i.issue_id
        where i.tenant_id = p_tenant_id and i.component_offer_id = v_offer.id
        order by o.opened_at nulls last, o.title, i.id
      loop
        -- A program that already holds an issue for this item (the offering program does) keeps it.
        if exists (select 1 from public.component_offer_issues k
          where k.tenant_id = p_tenant_id and k.component_offer_item_id = v_item.id and k.program_id = v_consumer.program_id) then
          v_skipped := v_skipped + 1;
          continue;
        end if;
        insert into public.operational_issues (tenant_id, program_id, title, description, severity, status, opened_at)
          values (p_tenant_id, v_consumer.program_id, v_item.title, v_item.description, v_item.severity, 'open', v_now)
          returning id into v_issue;
        insert into public.component_offer_issues (tenant_id, component_offer_id, component_offer_item_id, program_id,
            issue_id, system_component_id, source)
          values (p_tenant_id, v_offer.id, v_item.id, v_consumer.program_id, v_issue, v_consumer.system_component_id, false);
        v_issues := v_issues || jsonb_build_object('programId', v_consumer.program_id, 'issueId', v_issue);
        v_first := coalesce(v_first, v_issue);
        v_opened := v_opened + 1;
      end loop;
      if v_opened > 0 then
        v_programs := v_programs + 1;
        insert into public.activity_events (tenant_id, program_id, issue_id, actor_party_id, event_type, description, occurred_at)
          values (p_tenant_id, v_consumer.program_id, v_first, v_party, 'created',
            format(E'opened %s from %s accepted on %s\n%s: found in %s %s, and standing on version %s for every program built from it.',
              case when v_opened = 1 then 'an operational issue' else v_opened::text || ' operational issues' end,
              public.component_offer_words('finding', v_opened), v_defined.name,
              v_offer.title, v_source.program_code, v_source.system_code, v_defined.version_number),
            v_now);
      end if;
    end loop;
  elsif p_decision = 'accepted' then
    -- Reviewed once, then the standing for every consumer: one published component assessment of
    -- the component version, against the offering system's control baseline.
    select b.profile_resolution_id into v_baseline from public.system_effective_baselines b
      where b.tenant_id = p_tenant_id and b.system_id = v_offer.system_id;
    if v_baseline is null then
      raise exception 'The offering system records no control baseline to publish these determinations against' using errcode = '23514';
    end if;
    if (select r.state from public.profile_resolutions r where r.id = v_baseline) is distinct from 'published' then
      raise exception 'The offering system''s control baseline is still a draft. Publish it before accepting these determinations.' using errcode = '23514';
    end if;
    select array_agg(k.code order by public.natural_sort_key(k.code) collate "C", k.id) into v_outside
      from public.component_offer_items i
      join public.controls k on k.id = i.control_id
      where i.tenant_id = p_tenant_id and i.component_offer_id = v_offer.id
        and not exists (select 1 from public.selected_controls sc
          where sc.profile_resolution_id = v_baseline and sc.control_id = i.control_id);
    if v_outside is not null then
      raise exception '% outside the offering system''s control baseline, so nothing was published: %',
        case when cardinality(v_outside) = 1 then '1 offered control is' else cardinality(v_outside)::text || ' offered controls are' end,
        array_to_string(v_outside[1:5], ', ') || case when cardinality(v_outside) > 5 then ', …' else '' end
        using errcode = '23514';
    end if;
    insert into public.component_assessments (tenant_id, component_definition_revision_id, profile_resolution_id,
        title, description, assessor_party_id, started_on, completed_on)
      select p_tenant_id, v_defined.revision_id, v_baseline, v_offer.title,
        concat_ws(E'\n', format('Offered by %s from the published assessment results of %s, and accepted for %s version %s.',
          v_source.program_code, v_source.system_code, v_defined.name, v_defined.version_number), v_offer.note),
        -- The assessor, where one made every determination.
        case when count(distinct f.assessor_party_id) = 1 and count(f.assessor_party_id) = count(*)
          then min(f.assessor_party_id::text)::uuid end,
        (min(f.determined_at) at time zone 'UTC')::date, (max(f.determined_at) at time zone 'UTC')::date
      from public.component_offer_items i
      join public.assessment_findings f on f.tenant_id = i.tenant_id and f.id = i.assessment_finding_id
      where i.tenant_id = p_tenant_id and i.component_offer_id = v_offer.id
      returning id into v_assessment;
    insert into public.component_determinations (tenant_id, component_assessment_id, component_definition_revision_id,
        defined_component_id, control_id, determination, rationale, assessment_finding_id)
      select p_tenant_id, v_assessment, v_defined.revision_id, v_offer.defined_component_id, i.control_id,
        f.determination, nullif(btrim(coalesce(f.description, '')), ''), f.id
      from public.component_offer_items i
      join public.assessment_findings f on f.tenant_id = i.tenant_id and f.id = i.assessment_finding_id
      where i.tenant_id = p_tenant_id and i.component_offer_id = v_offer.id;
    get diagnostics v_determinations = row_count;
    update public.component_assessments
      set state = 'published', published_at = v_now, revision = revision + 1
      where tenant_id = p_tenant_id and id = v_assessment;
  end if;

  update public.component_offers
    set state = p_decision, reviewed_by_party_id = v_party, reviewed_at = v_now, review_note = v_note,
      component_assessment_id = v_assessment, revision = revision + 1
    where tenant_id = p_tenant_id and id = p_offer_id
    returning * into v_offer;
  v_event := public.record_component_offer_event(v_offer, v_party, 'reviewed',
    case
      when p_decision = 'returned' then
        format('returned the offer of %s on %s', public.component_offer_words(v_offer.kind, v_items), v_defined.name)
      when v_offer.kind = 'finding' then
        format('accepted the offer of %s on %s', public.component_offer_words(v_offer.kind, v_items), v_defined.name)
      else format('accepted %s offered on %s', public.component_offer_words(v_offer.kind, v_items), v_defined.name)
    end,
    case
      when p_decision = 'returned' then format('%s: %s', v_offer.title, v_note)
      when v_offer.kind = 'finding' then
        format('%s: stands on version %s for every program built from it; opened in %s.', v_offer.title,
          v_defined.version_number,
          case when v_programs = 1 then '1 other program' else v_programs::text || ' other programs' end)
      else format('%s: published as the standing of version %s for every program built from it.', v_offer.title,
        v_defined.version_number)
    end,
    v_now);
  v_result := jsonb_build_object(
    'offerId', v_offer.id,
    'kind', v_offer.kind,
    'state', v_offer.state,
    'revision', v_offer.revision,
    'reviewedAt', v_offer.reviewed_at,
    'programs', v_programs,
    'issues', v_issues,
    'skipped', v_skipped,
    'componentAssessmentId', v_assessment,
    'determinations', v_determinations,
    'activityEventId', v_event);
  insert into public.component_offer_requests (id, tenant_id, component_offer_id, command, request, result, created_by)
    values (p_request_id, p_tenant_id, v_offer.id, 'review', v_request, v_result, auth.uid());
  return v_result;
end;
$$;
revoke all on function public.review_component_offer(uuid, uuid, bigint, text, text, uuid) from public, anon;
grant execute on function public.review_component_offer(uuid, uuid, bigint, text, text, uuid) to authenticated;
comment on function public.review_component_offer(uuid, uuid, bigint, text, text, uuid) is 'Review an offer that waits on a component''s owner, at the revision the reader saw, in one transaction: accepted or returned (a note is required to return). An accepted finding stands on the component version: every other program that holds a system component built from it gets one open operational issue of its own for each issue offered, linked in component_offer_issues beside the offering program''s as the source, with one activity event a program; a program that already holds one is passed over. Accepted determinations are published as one component assessment of the component version against the offering system''s control baseline, each determination citing its assessment finding; a control outside that baseline refuses the review. The offering program''s activity says the offer was reviewed. An offer already reviewed or withdrawn, changed since it was read or not in the workspace is refused, as is a caller who may not write to the workspace. The same request sent again returns its first answer.';

-- ---------------------------------------------------------------------------------------------
-- The reads of slice 1, redefined from their definitions in 20261115070043_component_assessments
-- with only this added: owner_party_id is the component's effective owner (its own, else its
-- set's, which definition_owner_party_id still says), and component_consumers and system_upstream
-- gain keys for the findings that stand on a component version and the offers that wait.
-- ---------------------------------------------------------------------------------------------

-- ---------------------------------------------------------------------------------------------
-- Where a component version stands on each control.
-- ---------------------------------------------------------------------------------------------
create or replace function public.component_control_status(p_defined_component_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  answer jsonb;
  v_component public.defined_components;
  v_revision public.component_definition_revisions;
  v_definition public.component_definitions;
begin
  select * into v_component from public.defined_components where id = p_defined_component_id;
  if auth.uid() is null or v_component.id is null then
    raise exception 'Component access is required' using errcode = '42501';
  end if;
  select * into v_revision from public.component_definition_revisions
    where tenant_id = v_component.tenant_id and id = v_component.component_definition_revision_id;
  select * into v_definition from public.component_definitions
    where tenant_id = v_component.tenant_id and id = v_revision.component_definition_id;
  with
  line as materialized (
    select l.control_id, l.status, l.claimed, l.component_assessment_id, l.rationale,
      k.code, k.title, k.parent_control_id,
      public.natural_sort_key(k.code) collate "C" as code_order,
      upper(g.source_id) as family, g.title as family_title
    from public.component_standing_lines(array[p_defined_component_id]) l
    join public.controls k on k.id = l.control_id
    left join public.catalog_groups g on g.id = k.group_id
  ),
  deciding as (
    select a.id, a.title, a.published_at, a.completed_on, a.assessor_party_id, a.profile_resolution_id,
      count(*) as determinations
    from line l
    join public.component_assessments a on a.id = l.component_assessment_id
    group by a.id, a.title, a.published_at, a.completed_on, a.assessor_party_id, a.profile_resolution_id
  )
  select jsonb_build_object(
    'defined_component_id', p_defined_component_id,
    'component', jsonb_build_object(
      'id', v_component.id, 'name', v_component.name, 'component_type', v_component.component_type,
      'definition_id', v_definition.id, 'definition_code', v_definition.code, 'definition_name', v_definition.name,
      'revision_id', v_revision.id, 'version', v_revision.version_number, 'state', v_revision.state,
      'owner_party_id', public.component_owner_party(p_defined_component_id),
      'definition_owner_party_id', v_definition.owner_party_id, 'business_line_id', v_definition.business_line_id),
    -- The published assessments a determination that stands was taken from, the newest first.
    'assessments', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', d.id, 'title', d.title, 'published_at', d.published_at, 'completed_on', d.completed_on,
        'assessor_party_id', d.assessor_party_id, 'profile_resolution_id', d.profile_resolution_id,
        'determinations', d.determinations
      ) order by d.published_at desc, d.id desc), '[]'::jsonb) from deciding d),
    'totals', jsonb_build_object(
      'controls', (select count(*) from line),
      'satisfied', (select count(*) from line where status = 'satisfied'),
      'partially_satisfied', (select count(*) from line where status = 'partially_satisfied'),
      'other_than_satisfied', (select count(*) from line where status = 'other_than_satisfied'),
      'not_assessed', (select count(*) from line where status = 'not_assessed')),
    'controls', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', l.control_id, 'code', l.code, 'title', l.title, 'parent_id', l.parent_control_id,
        'family', l.family, 'family_title', l.family_title,
        'status', l.status, 'claimed', l.claimed,
        'assessment_id', l.component_assessment_id, 'rationale', l.rationale
      ) order by l.family nulls last, l.code_order, l.control_id), '[]'::jsonb)
      from line l)
  ) into answer;
  return answer;
end;
$$;
revoke all on function public.component_control_status(uuid) from public, anon;
grant execute on function public.component_control_status(uuid) to authenticated;
comment on function public.component_control_status(uuid) is 'Where one component version stands on each control it claims through its library implementations or was judged on: the latest published determination on that component version (satisfied, partially_satisfied, other_than_satisfied), or not_assessed for a claimed control nobody judged, with the totals and the published assessments those determinations were taken from. A draft assessment decides nothing. The component''s owner_party_id is its effective owner, its own (component_owners) else its set''s. Security invoker: a component the reader cannot read is refused.';

-- ---------------------------------------------------------------------------------------------
-- Where a component is used.
--
-- The answer follows the component through every version of its definition, so a consumer built
-- from an older version is listed too, with the version it took and how many published versions
-- it is behind. A product uses a component where an element of one of its versions is pinned to
-- it; each such element is listed with its version's state, whether that is the product's current
-- version (its latest published one, else its latest) and the configurations that include it. A
-- system uses it where one of its components is built from it; each is listed with its program,
-- the element it sits on (the one the component names, else the one a single inventory
-- relationship gives it, else its system), its pin in the system's latest configuration baseline (the latest
-- published, else the latest) and, where the element was inherited from a product, whether the
-- program declared it modified. A product variant whose configuration includes such an element
-- and that holds no element for it removed it, and is listed as removed.
--
-- The totals count a product by its current version, so a version nobody can change any more is
-- not counted as behind for ever: behind is the current product elements and the system
-- components built from an older version than the latest published one.
--
-- A finding stands on a component version once an offer of it was accepted (component_offers): the
-- answer lists each such finding with the version it stands on and how many programs still hold
-- their own issue for it open (findings), each system line carries the program's own open issues
-- for the findings that stand on the version it took, and findings_open and offers_open say how
-- many findings are still open somewhere and how many offers wait on the owner. The totals are
-- slice 1's, key for key.
-- ---------------------------------------------------------------------------------------------
create or replace function public.component_consumers(p_defined_component_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  answer jsonb;
  v_component public.defined_components;
  v_revision public.component_definition_revisions;
  v_definition public.component_definitions;
  v_latest public.component_definition_revisions;
  v_tenant uuid;
begin
  select * into v_component from public.defined_components where id = p_defined_component_id;
  if auth.uid() is null or v_component.id is null then
    raise exception 'Component access is required' using errcode = '42501';
  end if;
  v_tenant := v_component.tenant_id;
  select * into v_revision from public.component_definition_revisions
    where tenant_id = v_tenant and id = v_component.component_definition_revision_id;
  select * into v_definition from public.component_definitions
    where tenant_id = v_tenant and id = v_revision.component_definition_id;
  select * into v_latest from public.component_definition_revisions r
    where r.tenant_id = v_tenant and r.component_definition_id = v_definition.id and r.state = 'published'
    order by r.version_number desc limit 1;
  with
  lineage as materialized (
    select * from public.component_lineage(p_defined_component_id)
  ),
  product_rows as materialized (
    select pe.id as element_id, pe.code as element_code, pe.name as element_name,
      pr.id as product_revision_id, pr.version_number as product_version, pr.state as product_state,
      p.id as product_id, p.code as product_code, p.name as product_name, p.business_line_id,
      l.defined_component_id, l.version_number as version, l.behind,
      pr.id = (select c.id from public.product_revisions c
        where c.tenant_id = v_tenant and c.product_id = p.id
        order by (c.state = 'published') desc, c.version_number desc limit 1) as is_current,
      (select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'code', c.code, 'name', c.name) order by c.code, c.id), '[]'::jsonb)
        from public.product_configuration_elements m
        join public.product_configurations c on c.tenant_id = m.tenant_id and c.id = m.product_configuration_id
        where m.tenant_id = v_tenant and m.product_revision_id = pr.id and m.product_element_id = pe.id) as configurations
    from lineage l
    join public.product_elements pe on pe.tenant_id = v_tenant and pe.defined_component_id = l.defined_component_id
    join public.product_revisions pr on pr.tenant_id = v_tenant and pr.id = pe.product_revision_id
    join public.products p on p.tenant_id = v_tenant and p.id = pr.product_id
  ),
  system_rows as materialized (
    select sc.id as system_component_id, sc.code as component_code, sc.name as component_name,
      sc.version as component_version,
      b.id as system_id, b.code as system_code, b.name as system_name,
      e.id as element_id, e.code as element_code, e.name as element_name,
      g.id as program_id, g.code as program_code, g.name as program_name, g.business_line_id,
      l.defined_component_id, l.version_number as version, l.behind,
      e.product_element_id,
      case
        when e.product_change_kinds is not null then 'modified'
        when e.product_element_id is not null then 'inherited'
      end as change,
      e.product_change_kinds as change_kinds, e.product_change_rationale as change_rationale,
      pin.pin
    from lineage l
    join public.system_components sc on sc.tenant_id = v_tenant and sc.defined_component_id = l.defined_component_id
    join public.systems b on b.tenant_id = v_tenant and b.id = sc.system_id
    -- The element a component sits on is the one it names or, where it names none, the one a
    -- single inventory relationship gives it (system_component_element_links); else its system.
    left join public.system_component_element_links k on k.tenant_id = v_tenant and k.id = sc.id
    join public.systems e on e.tenant_id = v_tenant and e.id = coalesce(k.system_element_id, sc.system_id)
    join public.programs g on g.tenant_id = v_tenant and g.id = b.program_id
    left join lateral (
      select jsonb_build_object(
        'configuration_baseline_id', cb.id, 'name', cb.name, 'baseline_version', cb.version_number,
        'state', cb.state, 'version', cp.version) as pin
      from public.component_pins cp
      join public.configuration_baselines cb on cb.tenant_id = cp.tenant_id and cb.id = cp.configuration_baseline_id
      where cp.tenant_id = v_tenant and cp.system_component_id = sc.id
      order by (cb.state = 'published') desc, cb.version_number desc, cb.id limit 1
    ) pin on true
  ),
  -- A variant whose configuration includes an element built from the component and that holds no
  -- element for it: the program left it out.
  removed_rows as materialized (
    select b.id as system_id, b.code as system_code, b.name as system_name,
      g.id as program_id, g.code as program_code, g.name as program_name, g.business_line_id,
      pe.id as product_element_id, pe.code as element_code, pe.name as element_name,
      l.defined_component_id, l.version_number as version, l.behind
    from lineage l
    join public.product_elements pe on pe.tenant_id = v_tenant and pe.defined_component_id = l.defined_component_id
    join public.product_configuration_elements m
      on m.tenant_id = v_tenant and m.product_revision_id = pe.product_revision_id and m.product_element_id = pe.id
    join public.systems b
      on b.tenant_id = v_tenant and b.product_revision_id = m.product_revision_id
      and b.product_configuration_id = m.product_configuration_id and b.is_authorization_boundary
    join public.programs g on g.tenant_id = v_tenant and g.id = b.program_id
    where not exists (select 1 from public.systems s
      where s.tenant_id = v_tenant and s.boundary_system_id = b.id and s.product_element_id = pe.id)
  ),
  -- The findings that stand on a version of the component: each issue of an accepted offer.
  found as materialized (
    select o.id as offer_id, i.id as item_id, o.defined_component_id, l.version_number as version,
      o.reviewed_at as accepted_at, o.program_id as source_program_id, i.issue_id as source_issue_id,
      src.title, src.severity
    from lineage l
    join public.component_offers o
      on o.tenant_id = v_tenant and o.defined_component_id = l.defined_component_id
      and o.kind = 'finding' and o.state = 'accepted'
    join public.component_offer_items i on i.tenant_id = v_tenant and i.component_offer_id = o.id
    join public.operational_issues src on src.tenant_id = v_tenant and src.id = i.issue_id
  ),
  -- Each program's own issue for a finding that stands, and whether it is still open.
  held as materialized (
    select f.offer_id, f.item_id, f.defined_component_id, k.program_id, k.issue_id, k.source,
      x.title, x.severity, x.status, x.opened_at, x.status not in ('resolved', 'closed') as open
    from found f
    join public.component_offer_issues k on k.tenant_id = v_tenant and k.component_offer_item_id = f.item_id
    join public.operational_issues x on x.tenant_id = v_tenant and x.id = k.issue_id
  )
  select jsonb_build_object(
    'defined_component_id', p_defined_component_id,
    'component', jsonb_build_object(
      'id', v_component.id, 'name', v_component.name, 'component_type', v_component.component_type,
      'definition_id', v_definition.id, 'definition_code', v_definition.code, 'definition_name', v_definition.name,
      'revision_id', v_revision.id, 'version', v_revision.version_number, 'state', v_revision.state,
      'owner_party_id', public.component_owner_party(p_defined_component_id),
      'definition_owner_party_id', v_definition.owner_party_id, 'business_line_id', v_definition.business_line_id),
    -- The definition's latest published version, and the component of this name in it.
    'latest', case when v_latest.id is null then null else jsonb_build_object(
      'revision_id', v_latest.id, 'version', v_latest.version_number,
      'defined_component_id', (select l.defined_component_id from lineage l
        where l.component_definition_revision_id = v_latest.id order by l.defined_component_id limit 1)) end,
    'products', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'product_id', r.product_id, 'product_code', r.product_code, 'product_name', r.product_name,
        'business_line_id', r.business_line_id,
        'product_revision_id', r.product_revision_id, 'product_version', r.product_version,
        'product_state', r.product_state, 'current', r.is_current,
        'element_id', r.element_id, 'element_code', r.element_code, 'element_name', r.element_name,
        'configurations', r.configurations,
        'defined_component_id', r.defined_component_id, 'version', r.version, 'behind', r.behind
      ) order by r.product_code, r.product_version desc, r.element_code, r.element_id), '[]'::jsonb)
      from product_rows r),
    'systems', (
      select coalesce(jsonb_agg(x.line order by x.program_code, x.system_code, x.element_code, x.id), '[]'::jsonb)
      from (
        select r.program_code, r.system_code, r.element_code, r.system_component_id as id, jsonb_build_object(
          'program_id', r.program_id, 'program_code', r.program_code, 'program_name', r.program_name,
          'business_line_id', r.business_line_id,
          'system_id', r.system_id, 'system_code', r.system_code, 'system_name', r.system_name,
          'element_id', r.element_id, 'element_code', r.element_code, 'element_name', r.element_name,
          'system_component_id', r.system_component_id, 'component_code', r.component_code,
          'component_name', r.component_name, 'component_version', r.component_version,
          'product_element_id', r.product_element_id,
          'defined_component_id', r.defined_component_id, 'version', r.version, 'behind', r.behind,
          'pin', r.pin,
          'change', r.change, 'change_kinds', coalesce(to_jsonb(r.change_kinds), '[]'::jsonb),
          'change_rationale', r.change_rationale,
          -- The program's own open issues for the findings that stand on the version it took.
          'findings', (select coalesce(jsonb_agg(jsonb_build_object(
              'offer_id', h.offer_id, 'issue_id', h.issue_id, 'title', h.title, 'severity', h.severity,
              'status', h.status, 'opened_at', h.opened_at, 'source', h.source
            ) order by h.opened_at nulls last, h.issue_id), '[]'::jsonb)
            from held h
            where h.program_id = r.program_id and h.defined_component_id = r.defined_component_id and h.open),
          'findings_open', (select count(*) from held h
            where h.program_id = r.program_id and h.defined_component_id = r.defined_component_id and h.open)) as line
        from system_rows r
        union all
        select r.program_code, r.system_code, r.element_code, r.product_element_id, jsonb_build_object(
          'program_id', r.program_id, 'program_code', r.program_code, 'program_name', r.program_name,
          'business_line_id', r.business_line_id,
          'system_id', r.system_id, 'system_code', r.system_code, 'system_name', r.system_name,
          'element_id', null, 'element_code', r.element_code, 'element_name', r.element_name,
          'system_component_id', null, 'component_code', null,
          'component_name', null, 'component_version', null,
          'product_element_id', r.product_element_id,
          'defined_component_id', r.defined_component_id, 'version', r.version, 'behind', r.behind,
          'pin', null,
          'change', 'removed', 'change_kinds', '[]'::jsonb, 'change_rationale', null,
          'findings', '[]'::jsonb, 'findings_open', 0)
        from removed_rows r
      ) x),
    -- The findings that stand on a version of the component, the newest first.
    'findings', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'offer_id', f.offer_id, 'item_id', f.item_id, 'title', f.title, 'severity', f.severity,
        'defined_component_id', f.defined_component_id, 'version', f.version, 'accepted_at', f.accepted_at,
        'source_program_id', f.source_program_id, 'source_issue_id', f.source_issue_id,
        'programs', (select count(*) from held h where h.item_id = f.item_id),
        'programs_open', (select count(*) from held h where h.item_id = f.item_id and h.open)
      ) order by f.accepted_at desc, f.item_id), '[]'::jsonb)
      from found f),
    'totals', jsonb_build_object(
      'products', (select count(distinct r.product_id) from product_rows r where r.is_current),
      'product_elements', (select count(*) from product_rows),
      'programs', (select count(distinct r.program_id) from system_rows r),
      'systems', (select count(distinct r.system_id) from system_rows r),
      'system_components', (select count(*) from system_rows),
      'behind', (select count(*) from product_rows r where r.is_current and r.behind > 0)
        + (select count(*) from system_rows r where r.behind > 0),
      'modified', (select count(*) from system_rows r where r.change = 'modified'),
      'removed', (select count(*) from removed_rows)),
    -- How many of those findings some program still holds open, and how many offers wait on the
    -- component's owner, for any of its versions.
    'findings_open', (select count(*) from found f
      where exists (select 1 from held h where h.item_id = f.item_id and h.open)),
    'offers_open', (select count(*) from lineage l
      join public.component_offers o
        on o.tenant_id = v_tenant and o.defined_component_id = l.defined_component_id and o.state = 'offered')
  ) into answer;
  return answer;
end;
$$;
revoke all on function public.component_consumers(uuid) from public, anon;
grant execute on function public.component_consumers(uuid) to authenticated;
comment on function public.component_consumers(uuid) is 'Where a library component is used, followed by its name through every version of its definition: each product element pinned to it (its product and version, whether that is the product''s current version, the configurations that include it) and each system component built from it (its program, system and element, its pin in the system''s latest configuration baseline, whether the program declared the inherited element modified), each with the version taken and how many published versions of the definition are newer (behind); a variant that left the element out is listed as removed. Totals count a product by its current version. The component''s owner_party_id is its effective owner, its own (component_owners) else its set''s. The findings that stand on a version of the component (the issues of accepted offers) are listed with how many programs still hold their own issue open, each system line carries the program''s own open issues for the findings on the version it took, and findings_open and offers_open count the findings still open somewhere and the offers that wait on the owner. Security invoker: a component the reader cannot read is refused.';

-- ---------------------------------------------------------------------------------------------
-- What a system takes from above.
--
-- For an authorization boundary, every library component of the boundary; for an element inside
-- one, the components on that element and on the elements inside it. A system created from a
-- product names the product, the version it was created from and the newest published one. Each
-- library component says the version taken, the latest published version of its definition, how
-- many published versions it is behind, whether the program declared its inherited element
-- modified, and the component's standing as component_control_status counts it. Each also says
-- the program's own open issues for the findings that stand on the version it took (the issues of
-- accepted offers, component_offers) and how many offers wait on that version's owner, and the
-- answer counts both (findings_open, offers_open) beside the totals, which are slice 1's.
-- ---------------------------------------------------------------------------------------------
create or replace function public.system_upstream(p_system_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  answer jsonb;
  v_system public.systems;
  v_boundary public.systems;
  v_tenant uuid;
  v_revision public.product_revisions;
  v_product public.products;
  v_configuration public.product_configurations;
  v_latest public.product_revisions;
begin
  select * into v_system from public.systems where id = p_system_id;
  if auth.uid() is null or v_system.id is null then
    raise exception 'System access is required' using errcode = '42501';
  end if;
  v_tenant := v_system.tenant_id;
  select * into v_boundary from public.systems where tenant_id = v_tenant and id = v_system.boundary_system_id;
  if v_boundary.product_configuration_id is not null then
    select * into v_revision from public.product_revisions where tenant_id = v_tenant and id = v_boundary.product_revision_id;
    select * into v_product from public.products where tenant_id = v_tenant and id = v_revision.product_id;
    select * into v_configuration from public.product_configurations where tenant_id = v_tenant and id = v_boundary.product_configuration_id;
    select * into v_latest from public.product_revisions r
      where r.tenant_id = v_tenant and r.product_id = v_revision.product_id and r.state = 'published'
      order by r.version_number desc limit 1;
  end if;
  with recursive
  -- The elements the answer covers: the whole boundary, or one element and what is inside it.
  scope as (
    select s.id from public.systems s where s.tenant_id = v_tenant and s.id = p_system_id
    union all
    select s.id from public.systems s join scope p on s.parent_system_id = p.id where s.tenant_id = v_tenant
  ),
  used as materialized (
    select sc.id as system_component_id, sc.code, sc.name, sc.version as component_version,
      e.id as element_id, e.code as element_code, e.name as element_name, e.product_element_id,
      case
        when e.product_change_kinds is not null then 'modified'
        when e.product_element_id is not null then 'inherited'
      end as change,
      e.product_change_kinds as change_kinds,
      dc.id as defined_component_id, dc.name as component_name, dc.component_type,
      r.id as revision_id, r.version_number as version,
      d.id as definition_id, d.code as definition_code, d.name as definition_name,
      coalesce(named.owner_party_id, d.owner_party_id) as owner_party_id,
      d.owner_party_id as definition_owner_party_id, d.business_line_id,
      newest.id as latest_revision_id, newest.version_number as latest_version,
      (select count(*) from public.component_definition_revisions n
        where n.tenant_id = v_tenant and n.component_definition_id = d.id
          and n.state = 'published' and n.version_number > r.version_number) as behind,
      pin.pin
    from public.system_components sc
    -- The element a component sits on: the one it names, else the one a single inventory
    -- relationship gives it (system_component_element_links), else its system.
    left join public.system_component_element_links k on k.tenant_id = v_tenant and k.id = sc.id
    join public.systems e on e.tenant_id = v_tenant and e.id = coalesce(k.system_element_id, sc.system_id)
    join public.defined_components dc on dc.tenant_id = v_tenant and dc.id = sc.defined_component_id
    join public.component_definition_revisions r on r.tenant_id = v_tenant and r.id = dc.component_definition_revision_id
    join public.component_definitions d on d.tenant_id = v_tenant and d.id = r.component_definition_id
    -- The component's own owner, where one is named over its set's.
    left join public.component_owners named
      on named.tenant_id = v_tenant and named.component_definition_id = d.id and named.component_name = dc.name
    left join lateral (
      select n.id, n.version_number from public.component_definition_revisions n
      where n.tenant_id = v_tenant and n.component_definition_id = d.id and n.state = 'published'
      order by n.version_number desc limit 1
    ) newest on true
    left join lateral (
      select jsonb_build_object(
        'configuration_baseline_id', cb.id, 'name', cb.name, 'baseline_version', cb.version_number,
        'state', cb.state, 'version', cp.version) as pin
      from public.component_pins cp
      join public.configuration_baselines cb on cb.tenant_id = cp.tenant_id and cb.id = cp.configuration_baseline_id
      where cp.tenant_id = v_tenant and cp.system_component_id = sc.id
      order by (cb.state = 'published') desc, cb.version_number desc, cb.id limit 1
    ) pin on true
    where sc.tenant_id = v_tenant and sc.system_id = v_boundary.id
      and e.id in (select id from scope)
  ),
  standing as materialized (
    select l.defined_component_id,
      count(*) as controls,
      count(*) filter (where l.status = 'satisfied') as satisfied,
      count(*) filter (where l.status = 'partially_satisfied') as partially_satisfied,
      count(*) filter (where l.status = 'other_than_satisfied') as other_than_satisfied,
      count(*) filter (where l.status = 'not_assessed') as not_assessed
    from public.component_standing_lines(array(select distinct u.defined_component_id from used u)) l
    group by l.defined_component_id
  ),
  -- The program's own open issues for the findings that stand on the versions it took.
  held as materialized (
    select o.defined_component_id, o.id as offer_id, k.issue_id, k.source,
      x.title, x.severity, x.status, x.opened_at
    from public.component_offers o
    join public.component_offer_issues k
      on k.tenant_id = v_tenant and k.component_offer_id = o.id and k.program_id = v_system.program_id
    join public.operational_issues x on x.tenant_id = v_tenant and x.id = k.issue_id
    where o.tenant_id = v_tenant and o.kind = 'finding' and o.state = 'accepted'
      and o.defined_component_id in (select u.defined_component_id from used u)
      and x.status not in ('resolved', 'closed')
  ),
  -- The offers that wait on the owner of each version taken, whoever made them.
  waiting as materialized (
    select o.defined_component_id, count(*) as offers
    from public.component_offers o
    where o.tenant_id = v_tenant and o.state = 'offered'
      and o.defined_component_id in (select u.defined_component_id from used u)
    group by o.defined_component_id
  )
  select jsonb_build_object(
    'system_id', p_system_id,
    'boundary_system_id', v_boundary.id,
    'program_id', v_system.program_id,
    'product', case when v_boundary.product_configuration_id is null then null else jsonb_build_object(
      'id', v_product.id, 'code', v_product.code, 'name', v_product.name,
      'business_line_id', v_product.business_line_id,
      'revision_id', v_revision.id, 'version', v_revision.version_number,
      'configuration_id', v_configuration.id, 'configuration_code', v_configuration.code,
      'configuration', v_configuration.name,
      'latest_revision_id', v_latest.id, 'latest_version', v_latest.version_number,
      'behind', (select count(*) from public.product_revisions r
        where r.tenant_id = v_tenant and r.product_id = v_revision.product_id and r.state = 'published'
          and r.version_number > v_revision.version_number)) end,
    'components', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'system_component_id', u.system_component_id, 'code', u.code, 'name', u.name,
        'component_version', u.component_version,
        'element_id', u.element_id, 'element_code', u.element_code, 'element_name', u.element_name,
        'product_element_id', u.product_element_id,
        'change', u.change, 'change_kinds', coalesce(to_jsonb(u.change_kinds), '[]'::jsonb),
        'defined_component_id', u.defined_component_id, 'component_name', u.component_name,
        'component_type', u.component_type,
        'definition_id', u.definition_id, 'definition_code', u.definition_code, 'definition_name', u.definition_name,
        'owner_party_id', u.owner_party_id, 'definition_owner_party_id', u.definition_owner_party_id,
        'business_line_id', u.business_line_id,
        'revision_id', u.revision_id, 'version', u.version,
        'latest_revision_id', u.latest_revision_id, 'latest_version', u.latest_version,
        'behind', u.behind, 'pin', u.pin,
        'standing', jsonb_build_object(
          'controls', coalesce(s.controls, 0), 'satisfied', coalesce(s.satisfied, 0),
          'partially_satisfied', coalesce(s.partially_satisfied, 0),
          'other_than_satisfied', coalesce(s.other_than_satisfied, 0),
          'not_assessed', coalesce(s.not_assessed, 0)),
        'findings', (select coalesce(jsonb_agg(jsonb_build_object(
            'offer_id', h.offer_id, 'issue_id', h.issue_id, 'title', h.title, 'severity', h.severity,
            'status', h.status, 'opened_at', h.opened_at, 'source', h.source
          ) order by h.opened_at nulls last, h.issue_id), '[]'::jsonb)
          from held h where h.defined_component_id = u.defined_component_id),
        'findings_open', (select count(*) from held h where h.defined_component_id = u.defined_component_id),
        'offers_open', coalesce((select w.offers from waiting w where w.defined_component_id = u.defined_component_id), 0)
      ) order by public.natural_sort_key(u.element_code) collate "C", public.natural_sort_key(u.code) collate "C", u.system_component_id), '[]'::jsonb)
      from used u left join standing s on s.defined_component_id = u.defined_component_id),
    'totals', jsonb_build_object(
      'components', (select count(*) from used),
      'behind', (select count(*) from used u where u.behind > 0),
      'modified', (select count(*) from used u where u.change = 'modified'),
      'assessed', (select count(*) from used u join standing s on s.defined_component_id = u.defined_component_id
        where s.controls > s.not_assessed)),
    -- The program's open issues for findings that stand on what the system takes, each once, and
    -- the offers that wait on the owners of those versions.
    'findings_open', (select count(distinct h.issue_id) from held h),
    'offers_open', (select coalesce(sum(w.offers), 0) from waiting w)
  ) into answer;
  return answer;
end;
$$;
revoke all on function public.system_upstream(uuid) from public, anon;
grant execute on function public.system_upstream(uuid) to authenticated;
comment on function public.system_upstream(uuid) is 'What a system takes from above: for a system created from a product, the product, the version and configuration it was created from and the newest published version; and each library component the system (an authorization boundary whole, or one element and what is inside it) is built from, with the version taken, the latest published version of its definition, how many published versions it is behind, whether the program declared the inherited element modified, its pin in the latest configuration baseline, the component''s standing as component_control_status counts it, its effective owner (its own, else its set''s), the program''s own open issues for the findings that stand on the version taken (the issues of accepted offers) and how many offers wait on that version''s owner. Security invoker: a system the reader cannot read is refused.';

-- ---------------------------------------------------------------------------------------------
-- The components register: one row a component of each definition's latest published version,
-- else of its latest version.
--
-- A component is counted through every version of its definition, by its name: the products whose
-- current version (latest published, else latest) pins an element to it, the programs that hold a
-- system component built from it, how many of those consumers took an older version than the
-- latest published one (consumers_behind) and how many sit on an inherited element the program
-- declared modified (consumers_modified). Its standing is this version's: the latest published
-- determination on each control, and the newest assessment one of them was taken from. Its owner
-- is its effective owner, its own (component_owners) else its set's, and offers_open, its last
-- column, counts the offers that wait on that owner for any version of the component.
-- ---------------------------------------------------------------------------------------------
create or replace view public.component_rows with (security_invoker = true) as
with
head as (
  select distinct on (r.tenant_id, r.component_definition_id)
    r.tenant_id, r.component_definition_id, r.id, r.version_number, r.state, r.published_at
  from public.component_definition_revisions r
  order by r.tenant_id, r.component_definition_id, (r.state = 'published') desc, r.version_number desc
),
versions as (
  select r.tenant_id, r.id, r.component_definition_id,
    (select count(*) from public.component_definition_revisions n
      where n.tenant_id = r.tenant_id and n.component_definition_id = r.component_definition_id
        and n.state = 'published' and n.version_number > r.version_number) as behind
  from public.component_definition_revisions r
),
-- Every version of each listed component: the components of its name in its definition.
member as (
  select c.id as head_id, o.id as defined_component_id, v.behind
  from head h
  join public.defined_components c on c.tenant_id = h.tenant_id and c.component_definition_revision_id = h.id
  join versions v on v.tenant_id = h.tenant_id and v.component_definition_id = h.component_definition_id
  join public.defined_components o
    on o.tenant_id = v.tenant_id and o.component_definition_revision_id = v.id and o.name = c.name
),
product_use as (
  select m.head_id, count(distinct pr.product_id) as products,
    count(*) filter (where m.behind > 0) as behind
  from member m
  join public.product_elements pe on pe.defined_component_id = m.defined_component_id
  join public.product_revisions pr on pr.tenant_id = pe.tenant_id and pr.id = pe.product_revision_id
  where pr.id = (select c.id from public.product_revisions c
    where c.tenant_id = pr.tenant_id and c.product_id = pr.product_id
    order by (c.state = 'published') desc, c.version_number desc limit 1)
  group by m.head_id
),
system_use as (
  select m.head_id, count(distinct b.program_id) as programs,
    count(*) filter (where m.behind > 0) as behind,
    count(*) filter (where e.product_change_kinds is not null) as modified
  from member m
  join public.system_components sc on sc.defined_component_id = m.defined_component_id
  join public.systems b on b.tenant_id = sc.tenant_id and b.id = sc.system_id
  left join public.system_component_element_links k on k.tenant_id = sc.tenant_id and k.id = sc.id
  join public.systems e on e.tenant_id = sc.tenant_id and e.id = coalesce(k.system_element_id, sc.system_id)
  group by m.head_id
),
judged as (
  select distinct on (d.defined_component_id, d.control_id)
    d.defined_component_id, d.control_id, d.determination, d.component_assessment_id, a.published_at
  from public.component_determinations d
  join public.component_assessments a
    on a.tenant_id = d.tenant_id and a.id = d.component_assessment_id and a.state = 'published'
  order by d.defined_component_id, d.control_id, a.published_at desc, a.id desc
),
standing as (
  select j.defined_component_id, count(*) as determined,
    count(*) filter (where j.determination = 'satisfied') as satisfied,
    count(*) filter (where j.determination = 'partially_satisfied') as partially_satisfied,
    count(*) filter (where j.determination = 'other_than_satisfied') as other_than_satisfied,
    (array_agg(j.component_assessment_id order by j.published_at desc, j.component_assessment_id desc))[1] as assessment_id
  from judged j
  group by j.defined_component_id
),
claimed as (
  select i.defined_component_id, count(distinct i.control_id) as controls
  from public.defined_component_implementations i
  where i.control_id is not null
  group by i.defined_component_id
),
waiting as (
  select m.head_id, count(*) as offers
  from member m
  join public.component_offers o on o.defined_component_id = m.defined_component_id and o.state = 'offered'
  group by m.head_id
)
select c.id, c.tenant_id, c.name, c.component_type, c.description, c.supplier_party_id,
  d.id as component_definition_id, d.code as definition_code, d.name as definition_name, d.category,
  h.id as component_definition_revision_id, h.version_number as version, h.state, h.published_at,
  coalesce(named.owner_party_id, d.owner_party_id) as owner_party_id, owner.name as owner_name,
  d.business_line_id, line.code as business_line_code, line.name as business_line_name,
  coalesce(pu.products, 0) as products,
  coalesce(su.programs, 0) as programs,
  coalesce(pu.behind, 0) + coalesce(su.behind, 0) as consumers_behind,
  coalesce(su.modified, 0) as consumers_modified,
  st.assessment_id, a.title as assessment_title, a.completed_on as assessed_on,
  a.published_at as assessment_published_at,
  coalesce(cl.controls, 0) as controls_claimed,
  coalesce(st.determined, 0) as controls_determined,
  coalesce(st.satisfied, 0) as controls_satisfied,
  coalesce(st.partially_satisfied, 0) as controls_partially_satisfied,
  coalesce(st.other_than_satisfied, 0) as controls_other_than_satisfied,
  c.revision, c.created_at, c.updated_at, c.created_by, c.updated_by,
  coalesce(wt.offers, 0) as offers_open
from head h
join public.component_definitions d on d.tenant_id = h.tenant_id and d.id = h.component_definition_id
join public.defined_components c on c.tenant_id = h.tenant_id and c.component_definition_revision_id = h.id
left join public.component_owners named
  on named.tenant_id = d.tenant_id and named.component_definition_id = d.id and named.component_name = c.name
left join public.parties owner on owner.id = coalesce(named.owner_party_id, d.owner_party_id)
left join public.business_lines line on line.id = d.business_line_id
left join product_use pu on pu.head_id = c.id
left join system_use su on su.head_id = c.id
left join standing st on st.defined_component_id = c.id
left join public.component_assessments a on a.id = st.assessment_id
left join claimed cl on cl.defined_component_id = c.id
left join waiting wt on wt.head_id = c.id;
grant select on public.component_rows to authenticated;
revoke all on public.component_rows from public, anon;
comment on view public.component_rows is 'The components register, one row a component of each component definition''s latest published version (else its latest): its definition by code and name, its type, version and state, its effective owner (its own, else its set''s) and business line by name, how many products (by their current version) and programs use it in any version, how many of those consumers took an older version than the latest published one (consumers_behind) or sit on an inherited element the program declared modified (consumers_modified), and this version''s standing: the controls it claims, how many carry a published determination and how many of those are satisfied, with the newest published assessment one was taken from, and how many offers wait on its owner for any of its versions (offers_open).';

-- ---------------------------------------------------------------------------------------------
-- The offers register: one row an offer.
-- ---------------------------------------------------------------------------------------------
create or replace view public.component_offer_rows with (security_invoker = true) as
select o.id, o.tenant_id, o.kind,
  pg_catalog.array_position('{finding,determinations}'::text[], o.kind) as kind_rank,
  o.title, o.note, o.state,
  pg_catalog.array_position('{offered,accepted,returned,withdrawn}'::text[], o.state) as state_rank,
  o.defined_component_id, c.name as component_name, c.component_type,
  d.id as component_definition_id, d.code as definition_code, d.name as definition_name,
  r.id as component_definition_revision_id, r.version_number as version,
  o.program_id, g.code as program_code, g.name as program_name,
  o.system_id, s.code as system_code, s.name as system_name,
  o.system_component_id, sc.code as system_component_code, sc.name as system_component_name,
  (select count(*) from public.component_offer_items i
    where i.tenant_id = o.tenant_id and i.component_offer_id = o.id) as items,
  o.offered_by_party_id, offered_by.name as offered_by_name, o.offered_at,
  coalesce(named.owner_party_id, d.owner_party_id) as owner_party_id, owner.name as owner_name,
  case when o.state = 'offered' then coalesce(named.owner_party_id, d.owner_party_id) end as waiting_on_party_id,
  case when o.state = 'offered' then owner.name end as waiting_on_name,
  o.reviewed_by_party_id, reviewed_by.name as reviewed_by_name, o.reviewed_at, o.review_note,
  o.withdrawn_by_party_id, o.withdrawn_at,
  o.component_assessment_id,
  (select count(*) from public.component_offer_issues k
    where k.tenant_id = o.tenant_id and k.component_offer_id = o.id and not k.source) as issues_opened,
  o.revision, o.created_at, o.updated_at, o.created_by, o.updated_by
from public.component_offers o
join public.defined_components c on c.tenant_id = o.tenant_id and c.id = o.defined_component_id
join public.component_definition_revisions r
  on r.tenant_id = c.tenant_id and r.id = c.component_definition_revision_id
join public.component_definitions d on d.tenant_id = r.tenant_id and d.id = r.component_definition_id
join public.programs g on g.tenant_id = o.tenant_id and g.id = o.program_id
join public.systems s on s.tenant_id = o.tenant_id and s.id = o.system_id
join public.system_components sc on sc.tenant_id = o.tenant_id and sc.id = o.system_component_id
left join public.component_owners named
  on named.tenant_id = d.tenant_id and named.component_definition_id = d.id and named.component_name = c.name
left join public.parties owner on owner.id = coalesce(named.owner_party_id, d.owner_party_id)
left join public.parties offered_by on offered_by.id = o.offered_by_party_id
left join public.parties reviewed_by on reviewed_by.id = o.reviewed_by_party_id;
grant select on public.component_offer_rows to authenticated;
revoke all on public.component_offer_rows from public, anon;
comment on view public.component_offer_rows is 'The offers register, one row an offer of a program''s result to a shared component''s owner: its kind and state with the ranks they sort by, the component by name with its set and version, the offering program, system and system component, how many items it holds, who offered it and when, the component''s effective owner and, while the offer waits, that owner as who it waits on, who reviewed it, when and with what note, the component assessment accepted determinations were published as, and how many operational issues an accepted finding opened in other programs.';

-- ---------------------------------------------------------------------------------------------
-- The Review queue gains a kind: an offer that waits on a component's owner.
--
--   component_offer     an offer of a program's result on a shared component, still offered,
--                       waiting on the component's effective owner (Offer to review).
--
-- The row is the offer, by its own id; the record it belongs to is the component version
-- (parent_table defined_components, with its version), its program is the offering program, it
-- waits since it was offered, the party that offered it asked (an offer names that party itself,
-- where the other kinds find it through the account that wrote the record), and
-- determination_count is how many determinations accepting it would publish. The view is
-- redefined from 20261113215841_review_queue with only that branch and its rank, the last, added;
-- its columns keep their names and their places, and nothing depends on it.
-- ---------------------------------------------------------------------------------------------
drop view if exists public.review_queue_rows;
create view public.review_queue_rows with (security_invoker = true) as
with items as (
  select v.id, r.tenant_id, 'evidence'::text as kind, 'evidence_versions'::text as record_table,
    'evidence_artifacts'::text as parent_table, a.id as parent_id, a.title as parent_name,
    null::jsonb as target, v.version_number, a.title as name, a.program_id,
    r.created_at as waiting_since, r.reviewer_party_id as waiting_on_party_id,
    r.created_by as requested_by_user, null::text as requested_by_label, null::uuid as requested_by_party,
    a.owner_party_id, null::date as due_on, null::bigint as determination_count
  from public.evidence_reviews r
  join public.evidence_versions v on v.tenant_id = r.tenant_id and v.id = r.evidence_version_id
  join public.evidence_artifacts a on a.tenant_id = v.tenant_id and a.id = v.artifact_id
  where r.decision = 'pending'
    -- The artifact's latest version, and that version's latest review, as the evidence register
    -- reads its Latest review.
    and not exists (
      select 1 from public.evidence_versions newer
      where newer.tenant_id = v.tenant_id and newer.artifact_id = v.artifact_id
        and newer.version_number > v.version_number)
    and not exists (
      select 1 from public.evidence_reviews later
      where later.tenant_id = r.tenant_id and later.evidence_version_id = r.evidence_version_id
        and (coalesce(later.reviewed_at, later.created_at), later.id)
          > (coalesce(r.reviewed_at, r.created_at), r.id))
  union all
  select ar.id, ar.tenant_id, 'assessment_results', 'assessment_results_revisions',
    'assessment_campaigns', campaign.id, campaign.title, null::jsonb, ar.version_number, ar.title,
    campaign.program_id, recorded.first_at, null::uuid, null::uuid, null::text, null::uuid,
    campaign.owner_party_id, null::date, recorded.held
  from public.assessment_results_revisions ar
  join public.assessment_plan_revisions plan
    on plan.tenant_id = ar.tenant_id and plan.id = ar.assessment_plan_revision_id
  join public.assessment_campaigns campaign
    on campaign.tenant_id = plan.tenant_id and campaign.id = plan.campaign_id
  cross join lateral (
    select min(f.created_at) as first_at, count(*) as held
    from public.assessment_findings f
    where f.tenant_id = ar.tenant_id and f.assessment_results_revision_id = ar.id
  ) recorded
  where ar.state = 'draft' and recorded.held > 0
  union all
  select pa.id, pa.tenant_id, 'product_assessment', 'product_assessments', 'products',
    product.id, product.name, null::jsonb, product_version.version_number, pa.title, null::uuid,
    determined.first_at, pa.assessor_party_id, null::uuid, null::text, null::uuid, null::uuid, null::date,
    determined.held
  from public.product_assessments pa
  join public.product_revisions product_version
    on product_version.tenant_id = pa.tenant_id and product_version.id = pa.product_revision_id
  join public.products product
    on product.tenant_id = product_version.tenant_id
      and product.id = product_version.product_id
  cross join lateral (
    select min(d.created_at) as first_at, count(*) as held
    from public.product_determinations d
    where d.tenant_id = pa.tenant_id and d.product_assessment_id = pa.id
  ) determined
  where pa.state = 'draft' and determined.held > 0
  union all
  select g.id, g.tenant_id, 'gate', 'lifecycle_gates', null::text, null::uuid, null::text,
    null::jsonb, null::integer, g.title, g.program_id, g.updated_at, null::uuid, null::uuid,
    null::text, null::uuid, null::uuid, g.due_on, null::bigint
  from public.lifecycle_gates g
  where g.status = 'in_review'
  union all
  select pv.id, pv.tenant_id, 'package', 'package_revisions', 'authorization_packages', p.id,
    p.title, null::jsonb, pv.version_number, p.title, p.program_id, pv.submitted_at, null::uuid,
    null::uuid, null::text, null::uuid, p.owner_party_id, null::date, null::bigint
  from public.package_revisions pv
  join public.authorization_packages p on p.tenant_id = pv.tenant_id and p.id = pv.package_id
  -- An authorization decision is recorded on a published version: a draft is the program's still.
  where pv.state = 'published' and pv.submitted_at is not null
    and not exists (
      select 1 from public.package_revisions newer
      where newer.tenant_id = pv.tenant_id and newer.package_id = pv.package_id
        and newer.state = 'published' and newer.submitted_at is not null
        and newer.version_number > pv.version_number)
    and not exists (
      select 1 from public.authorization_decisions decision
      where decision.tenant_id = pv.tenant_id and decision.package_revision_id = pv.id)
  union all
  select t.id, t.tenant_id, 'discussion', 'assurance_review_threads', null::text, null::uuid,
    null::text, t.target, null::integer, t.subject, t.program_id, t.created_at, null::uuid,
    t.created_by, t.author_name, null::uuid, null::uuid, null::date, null::bigint
  from public.assurance_review_threads t
  where t.status = 'open'
  union all
  select o.id, o.tenant_id, 'component_offer', 'component_offers', 'defined_components', c.id, c.name,
    null::jsonb, version.version_number, o.title, o.program_id, o.offered_at,
    coalesce(named.owner_party_id, definition.owner_party_id), null::uuid, null::text,
    o.offered_by_party_id, null::uuid, null::date,
    case when o.kind = 'determinations' then (
      select count(*) from public.component_offer_items held
      where held.tenant_id = o.tenant_id and held.component_offer_id = o.id) end
  from public.component_offers o
  join public.defined_components c on c.tenant_id = o.tenant_id and c.id = o.defined_component_id
  join public.component_definition_revisions version
    on version.tenant_id = c.tenant_id and version.id = c.component_definition_revision_id
  join public.component_definitions definition
    on definition.tenant_id = version.tenant_id and definition.id = version.component_definition_id
  -- The component's own owner, where one is named over its set's.
  left join public.component_owners named
    on named.tenant_id = definition.tenant_id and named.component_definition_id = definition.id
      and named.component_name = c.name
  where o.state = 'offered'
)
select i.id, i.tenant_id, i.kind,
  pg_catalog.array_position(
    '{evidence,assessment_results,product_assessment,gate,package,discussion,component_offer}'::text[], i.kind
  ) as kind_rank,
  i.record_table, i.parent_table, i.parent_id, i.parent_name, i.target, i.version_number, i.name,
  i.program_id, program.name as program_name, i.waiting_since,
  i.waiting_on_party_id, waiting_on.name as waiting_on_name,
  coalesce(asker.id, requester.id) as requested_by_party_id,
  coalesce(asker.name, requester.name, i.requested_by_label) as requested_by_name,
  i.owner_party_id, owner.name as owner_name, i.due_on, i.determination_count
from items i
left join public.programs program on program.id = i.program_id
left join public.parties waiting_on on waiting_on.id = i.waiting_on_party_id
left join public.parties owner on owner.id = i.owner_party_id
left join public.parties asker on asker.id = i.requested_by_party
left join lateral (
  select p.id, p.name
  from public.parties p
  where p.tenant_id = i.tenant_id and p.auth_user_id = i.requested_by_user
  order by p.id
  limit 1
) requester on true;
grant select on public.review_queue_rows to authenticated;
revoke all on public.review_queue_rows from public, anon;
comment on view public.review_queue_rows is 'The Review queue, one row per record waiting on a reviewer across the workspace (evidence to accept, assessment results and product assessments to publish, gates and packages to decide, discussions to resolve, offers to a shared component''s owner to review): its kind with the rank it sorts by, its program, who it waits on, who asked, its owner, and when it began to wait.';
