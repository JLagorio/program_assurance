-- Gate criteria drawn from the security outcomes of NIST SP 800-160 Vol. 1 Rev. 1. Each of its 30
-- system life cycle processes lists the security outcomes the process achieves, and an outcome
-- reads as a criterion of a lifecycle gate: "Security-relevant system requirements and
-- security-driven design constraints are defined." A criterion keeps the outcome it was drawn
-- from, so its register can say which process it came from; a criterion somebody wrote keeps none.
--
-- The outcomes are reference rows of the framework nist-sp800-160v1r1-processes
-- (docs/reference-seeding.md): a process group holds processes, and a process its outcomes. A
-- published revision is immutable, so the item a criterion names stays what it was read as when a
-- later reading of the publication replaces it. An item keeps its code from one revision to the
-- next, so "already a criterion of this gate" is asked by the outcome's code, never by its id.
--
-- Every statement here can run again: this migration is also applied by hand.

-- ---------------------------------------------------------------------------------------------
-- The outcome a criterion was drawn from.
-- ---------------------------------------------------------------------------------------------
alter table public.gate_criteria
  add column if not exists outcome_item_id uuid references public.framework_items(id);
comment on column public.gate_criteria.outcome_item_id is 'The security outcome the criterion was drawn from: an outcome of the system life cycle processes (NIST SP 800-160 Vol. 1), in the revision it was read from. Empty for a criterion somebody wrote. Set by add_gate_security_outcomes only.';

-- A gate holds an outcome once, and the importer finds the criteria that name an item.
create unique index if not exists gate_criteria_outcome_once_idx
  on public.gate_criteria (gate_id, outcome_item_id) where outcome_item_id is not null;
create index if not exists gate_criteria_outcome_item_idx
  on public.gate_criteria (outcome_item_id) where outcome_item_id is not null;

-- A shared item or one of the criterion's own workspace, as for every reference a domain record
-- names (attach_reference_tenant_guard, written out so that it can run again).
create or replace trigger reference_tenant_outcome_item_id before insert or update on public.gate_criteria
  for each row execute function public.guard_reference_tenant('outcome_item_id', 'framework_items');

-- What the foreign key cannot say, and who may say it. The generic record form creates and edits
-- criteria, so the table stays writable; the outcome is a fact the command records, as a library
-- application is (guard_library_application). It runs as the caller, so current_user is the
-- client's role for a direct write and the command's owner inside the command.
create or replace function public.guard_gate_criterion_outcome() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.outcome_item_id is not distinct from old.outcome_item_id then return new; end if;
  if tg_op = 'INSERT' and new.outcome_item_id is null then return new; end if;
  if current_user in ('authenticated', 'anon') then
    raise exception 'Use Add security outcomes to draw a gate criterion from a security outcome' using errcode = '23514';
  end if;
  if new.outcome_item_id is not null and not exists (
    select 1 from public.framework_items i
    join public.framework_revisions r on r.id = i.framework_revision_id
    join public.frameworks f on f.id = r.framework_id
    where i.id = new.outcome_item_id and i.kind = 'outcome'
      and f.code = 'nist-sp800-160v1r1-processes' and r.state = 'published'
  ) then
    raise exception 'A gate criterion is drawn from a security outcome of the system life cycle processes' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_gate_criterion_outcome() from public, anon, authenticated;
create or replace trigger gate_criterion_outcome before insert or update on public.gate_criteria
  for each row execute function public.guard_gate_criterion_outcome();

-- ---------------------------------------------------------------------------------------------
-- Add security outcomes: the chosen outcomes become criteria of one gate, in one request.
-- ---------------------------------------------------------------------------------------------
create table if not exists public.gate_outcome_requests (
  id uuid primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  gate_id uuid not null,
  payload_sha256 text not null check (payload_sha256 ~ '^[a-f0-9]{64}$'),
  result jsonb not null check (jsonb_typeof(result) = 'object'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  -- A receipt goes with its gate, so it never keeps a gate from being removed.
  foreign key (tenant_id, gate_id) references public.lifecycle_gates(tenant_id, id) on delete cascade
);
create index if not exists gate_outcome_requests_gate_idx on public.gate_outcome_requests (tenant_id, gate_id);
alter table public.gate_outcome_requests enable row level security;
revoke all on public.gate_outcome_requests from public, anon, authenticated;
comment on table public.gate_outcome_requests is 'Private receipts of add_gate_security_outcomes: a request sent again with the same choice returns what it first answered, and one sent with another choice conflicts. No client reads them.';

create or replace function public.add_gate_security_outcomes(
  p_tenant_id uuid,
  p_gate_id uuid,
  p_request_id uuid,
  p_outcome_item_ids uuid[]
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_receipt public.gate_outcome_requests; v_ids uuid[]; v_hash text;
  v_outcomes integer; v_last integer; v_added uuid[]; v_result jsonb;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then
    raise exception 'Workspace write access is required' using errcode = '42501';
  end if;
  if p_gate_id is null or p_request_id is null or p_outcome_item_ids is null
    or cardinality(p_outcome_item_ids) not between 1 and 500
    or array_position(p_outcome_item_ids, null) is not null then
    raise exception 'Choose between 1 and 500 security outcomes to add to the gate' using errcode = '23514';
  end if;
  -- The choice in one spelling: each outcome once, whatever order it was chosen in.
  select array_agg(distinct chosen.item_id order by chosen.item_id) into v_ids
    from unnest(p_outcome_item_ids) as chosen(item_id);
  -- One answer per request, and one request at a time per gate, so two never number the same place.
  perform pg_advisory_xact_lock(hashtextextended('gate-security-outcomes/' || p_request_id::text, 0));
  perform 1 from public.lifecycle_gates g where g.tenant_id = p_tenant_id and g.id = p_gate_id for no key update;
  if not found then raise exception 'Lifecycle gate was not found in this workspace' using errcode = '23514'; end if;
  v_hash := encode(extensions.digest(jsonb_build_object('gateId', p_gate_id, 'outcomeItemIds', to_jsonb(v_ids))::text, 'sha256'), 'hex');
  select * into v_receipt from public.gate_outcome_requests r where r.id = p_request_id;
  if found then
    if v_receipt.tenant_id <> p_tenant_id or v_receipt.gate_id <> p_gate_id or v_receipt.payload_sha256 <> v_hash then
      raise exception 'This request has already been used for a different choice. Choose the security outcomes again.' using errcode = 'PT409';
    end if;
    return v_receipt.result;
  end if;
  -- Every chosen item is an outcome of the life cycle processes, in a published revision the
  -- workspace can read. One that is not refuses the whole choice.
  select count(*) into v_outcomes
    from public.framework_items i
    join public.framework_revisions r on r.id = i.framework_revision_id
    join public.frameworks f on f.id = r.framework_id
    where i.id = any(v_ids) and i.kind = 'outcome' and f.code = 'nist-sp800-160v1r1-processes'
      and r.state = 'published' and (i.tenant_id is null or i.tenant_id = p_tenant_id);
  if v_outcomes <> cardinality(v_ids) then
    raise exception 'Choose security outcomes of the system life cycle processes' using errcode = '23514';
  end if;
  select coalesce(max(c.sequence_number), 0) into v_last
    from public.gate_criteria c where c.tenant_id = p_tenant_id and c.gate_id = p_gate_id;
  -- An outcome the gate already holds is left as it is, by its code: the same outcome read from
  -- another revision is the same outcome. The rest follow the gate's last criterion in the order
  -- the publication prints them: its groups, each group's processes, each process's outcomes.
  with chosen as (
    select i.id, i.code, i.title, r.framework_id,
      row_number() over (partition by r.framework_id, i.code order by i.id) as copy,
      g.ordinal as group_place, p.ordinal as process_place, i.ordinal as place
    from public.framework_items i
    join public.framework_revisions r on r.id = i.framework_revision_id
    left join public.framework_items p on p.id = i.parent_item_id
    left join public.framework_items g on g.id = p.parent_item_id
    where i.id = any(v_ids)
  ), fresh as (
    select c.id, c.code, c.title, c.group_place, c.process_place, c.place
    from chosen c
    where c.copy = 1 and not exists (
      select 1 from public.gate_criteria k
      join public.framework_items ki on ki.id = k.outcome_item_id
      join public.framework_revisions kr on kr.id = ki.framework_revision_id
      where k.tenant_id = p_tenant_id and k.gate_id = p_gate_id
        and kr.framework_id = c.framework_id and ki.code = c.code
    )
  ), added as (
    insert into public.gate_criteria (tenant_id, gate_id, title, required, sequence_number, outcome_item_id)
    select p_tenant_id, p_gate_id, f.title, true,
      v_last + row_number() over (order by f.group_place nulls last, f.process_place nulls last, f.place, f.code),
      f.id
    from fresh f
    returning id, sequence_number
  )
  select coalesce(array_agg(a.id order by a.sequence_number), '{}') into v_added from added a;
  v_result := jsonb_build_object(
    'gateId', p_gate_id,
    'added', cardinality(v_added),
    'skipped', cardinality(v_ids) - cardinality(v_added),
    'criterionIds', to_jsonb(v_added)
  );
  insert into public.gate_outcome_requests (id, tenant_id, gate_id, payload_sha256, result, created_by)
    values (p_request_id, p_tenant_id, p_gate_id, v_hash, v_result, auth.uid());
  return v_result;
end;
$$;
revoke all on function public.add_gate_security_outcomes(uuid, uuid, uuid, uuid[]) from public, anon;
grant execute on function public.add_gate_security_outcomes(uuid, uuid, uuid, uuid[]) to authenticated;
comment on function public.add_gate_security_outcomes(uuid, uuid, uuid, uuid[]) is 'Add the chosen security outcomes of the system life cycle processes (NIST SP 800-160 Vol. 1) to one lifecycle gate as criteria, in one transaction: each criterion is titled with its outcome''s sentence, is required and follows the gate''s last criterion in the order the publication prints the outcomes. An outcome the gate already holds is skipped. The request id is chosen once per choice: the same request sent again returns its first answer and adds nothing.';

-- ---------------------------------------------------------------------------------------------
-- The register's derived columns: the outcome a criterion was drawn from, by its code, and the
-- process and the process group that hold it. Read as the caller (security_invoker), so row-level
-- security on the criteria and on the reference rows decides what the reader sees.
-- ---------------------------------------------------------------------------------------------
create or replace view public.gate_criterion_rows with (security_invoker = true) as
select c.id, c.tenant_id, c.gate_id, c.title, c.description, c.required, c.sequence_number,
  c.revision, c.created_at, c.updated_at,
  c.outcome_item_id, o.code as outcome_code,
  p.code as process_code, p.title as process_title,
  g.code as group_code, g.title as group_title
from public.gate_criteria c
left join public.framework_items o on o.id = c.outcome_item_id
left join public.framework_items p on p.id = o.parent_item_id
left join public.framework_items g on g.id = p.parent_item_id;
revoke all on public.gate_criterion_rows from public, anon, authenticated;
grant select on public.gate_criterion_rows to authenticated;
comment on view public.gate_criterion_rows is 'Each gate criterion with the security outcome it was drawn from, by code, and the life cycle process and process group that hold the outcome (process_code, process_title, group_code, group_title). They are empty for a criterion somebody wrote.';
