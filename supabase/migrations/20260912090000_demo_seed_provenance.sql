-- Explicit importer audit records. These are provenance metadata, not a second
-- operational data store or a runtime fallback for missing domain records.
create table public.demo_import_batches (
  id uuid primary key,
  tenant_id uuid not null references public.tenants(id),
  ingestion_job_id uuid not null,
  dataset_id text not null,
  fixture_sha256 text not null check (fixture_sha256 ~ '^[a-f0-9]{64}$'),
  imported_at timestamptz not null,
  source_manifest jsonb not null check (jsonb_typeof(source_manifest)='object'),
  summary jsonb not null check (jsonb_typeof(summary)='object'),
  unique(tenant_id,id),
  unique(tenant_id,dataset_id,fixture_sha256),
  foreign key(tenant_id,ingestion_job_id) references public.ingestion_jobs(tenant_id,id)
);
create table public.demo_import_sources (
  id uuid primary key,
  tenant_id uuid not null references public.tenants(id),
  import_batch_id uuid not null,
  source_pointer text not null,
  source_sha256 text not null check(source_sha256 ~ '^[a-f0-9]{64}$'),
  source_record jsonb,
  unique(tenant_id,id), unique(tenant_id,import_batch_id,source_pointer),
  foreign key(tenant_id,import_batch_id) references public.demo_import_batches(tenant_id,id)
);
create table public.demo_import_records (
  id uuid primary key,
  tenant_id uuid not null references public.tenants(id),
  import_batch_id uuid not null,
  dataset_id text not null,
  destination_table text not null check(destination_table ~ '^[a-z_]+$'),
  destination_id uuid not null,
  source_key text not null,
  source_pointer text,
  source_sha256 text not null check(source_sha256 ~ '^[a-f0-9]{64}$'),
  source_record_id uuid not null,
  mapped_values jsonb not null check(jsonb_typeof(mapped_values)='object'),
  unique(tenant_id,id),
  unique(tenant_id,dataset_id,destination_table,source_key),
  unique(tenant_id,destination_table,destination_id),
  foreign key(tenant_id,import_batch_id) references public.demo_import_batches(tenant_id,id),
  foreign key(tenant_id,source_record_id) references public.demo_import_sources(tenant_id,id)
);
-- The local CLI performs inserts as the database administrator. App identities
-- can inspect their own provenance but cannot forge, edit, or erase it.
alter table public.demo_import_batches enable row level security;
alter table public.demo_import_records enable row level security;
alter table public.demo_import_sources enable row level security;
revoke all on public.demo_import_batches,public.demo_import_records,public.demo_import_sources from public,anon,authenticated;
grant select on public.demo_import_batches,public.demo_import_records,public.demo_import_sources to authenticated;
create policy demo_batches_read on public.demo_import_batches for select to authenticated using(public.can_read_tenant(tenant_id));
create policy demo_sources_read on public.demo_import_sources for select to authenticated using(public.can_read_tenant(tenant_id));
create policy demo_records_read on public.demo_import_records for select to authenticated using(public.can_read_tenant(tenant_id));
create function public.validate_demo_import_destination() returns trigger
language plpgsql security definer set search_path='' as $$
declare present boolean;
begin
  if not exists(select 1 from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname=new.destination_table and c.relkind='r') then
    raise exception 'Unknown demo destination table' using errcode='23514';
  end if;
  execute format('select exists(select 1 from public.%I where id=$1 and tenant_id=$2)',new.destination_table) into present using new.destination_id,new.tenant_id;
  if not present then raise exception 'Demo provenance must refer to an existing record in the same tenant' using errcode='23503'; end if;
  return new;
end;
$$;
revoke all on function public.validate_demo_import_destination() from public,anon,authenticated;
create trigger demo_destination before insert or update on public.demo_import_records for each row execute function public.validate_demo_import_destination();

-- Observations can originate outside a formally pinned assessment execution.
-- Their known program context must not require inventing an event or test run.
alter table public.observations add column program_id uuid;
alter table public.observations add constraint observations_program_tenant_fk foreign key(tenant_id,program_id) references public.programs(tenant_id,id);
create index observations_program_idx on public.observations(tenant_id,program_id);

-- A recorded absence of implementation is different from a future plan.
alter table public.implemented_requirements drop constraint implemented_requirements_implementation_status_check;
alter table public.implemented_requirements add constraint implemented_requirements_implementation_status_check check(implementation_status in ('planned','not_implemented','partial','implemented','alternative','not_applicable'));
alter table public.component_contributions drop constraint component_contributions_implementation_status_check;
alter table public.component_contributions add constraint component_contributions_implementation_status_check check(implementation_status in ('planned','not_implemented','partial','implemented','alternative','not_applicable'));

-- Preserve explicit workflow states without upgrading them to approvals or
-- substituting a different operational state merely to fit an enum.
alter table public.workstreams drop constraint workstreams_status_check;
alter table public.workstreams add constraint workstreams_status_check check(status in ('planned','active','blocked','completed','cancelled'));
alter table public.poam_items drop constraint poam_items_status_check;
alter table public.poam_items add constraint poam_items_status_check check(status in ('open','in_progress','deferred','overdue','completed','risk_accepted','cancelled'));
alter table public.lifecycle_gates drop constraint lifecycle_gates_status_check;
alter table public.lifecycle_gates add constraint lifecycle_gates_status_check check(status in ('not_started','in_review','completed','at_risk','blocked','passed','failed','waived'));
