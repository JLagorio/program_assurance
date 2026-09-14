-- Normalized assessment, evidence, remediation and workflow records.
-- Operational tables intentionally begin empty. Every domain link is a real FK.

create table public.evidence_artifacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  title text not null check (length(btrim(title)) > 0),
  description text,
  artifact_kind text not null check (artifact_kind in ('document', 'image', 'dataset', 'log', 'scan', 'interview', 'test_record', 'other')),
  program_id uuid,
  scope_id uuid,
  owner_party_id uuid,
  source_uri text,
  retention_until date,
  unique (tenant_id, id),
  foreign key (tenant_id, program_id) references public.programs(tenant_id, id) on delete restrict,
  foreign key (tenant_id, scope_id) references public.scopes(tenant_id, id) on delete restrict,
  foreign key (tenant_id, owner_party_id) references public.parties(tenant_id, id) on delete restrict
);

create table public.evidence_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  version_number integer not null check (version_number > 0),
  state text not null default 'draft' check (state in ('draft', 'published')),
  published_at timestamptz,
  published_by_party_id uuid,
  check ((state = 'draft' and published_at is null) or (state = 'published' and published_at is not null)),
  artifact_id uuid not null,
  description text,
  media_type text,
  byte_size bigint check (byte_size is null or byte_size >= 0),
  sha256 text check (sha256 is null or sha256 ~ '^[a-fA-F0-9]{64}$'),
  external_uri text,
  storage_object_name text,
  collected_at timestamptz,
  expires_at timestamptz,
  provenance text,
  unique (tenant_id, id),
  foreign key (tenant_id, artifact_id) references public.evidence_artifacts(tenant_id, id) on delete restrict,
  foreign key (tenant_id, published_by_party_id) references public.parties(tenant_id, id) on delete restrict,
  unique (tenant_id, artifact_id, version_number),
  check (storage_object_name is null or storage_object_name like tenant_id::text || '/' || artifact_id::text || '/' || id::text || '/%'),
  check (expires_at is null or collected_at is null or expires_at >= collected_at)
);

create table public.evidence_reviews (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  evidence_version_id uuid not null,
  reviewer_party_id uuid not null,
  decision text not null check (decision in ('pending', 'accepted', 'needs_revision', 'rejected')),
  rationale text,
  reviewed_at timestamptz,
  unique (tenant_id, id),
  foreign key (tenant_id, evidence_version_id) references public.evidence_versions(tenant_id, id) on delete restrict,
  foreign key (tenant_id, reviewer_party_id) references public.parties(tenant_id, id) on delete restrict,
  check (decision = 'pending' or (reviewed_at is not null and rationale is not null))
);

create table public.assessment_campaigns (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  title text not null check (length(btrim(title)) > 0),
  description text,
  program_id uuid not null,
  scope_id uuid,
  owner_party_id uuid,
  status text not null default 'planned' check (status in ('planned', 'active', 'completed', 'cancelled')),
  starts_at timestamptz,
  ends_at timestamptz,
  unique (tenant_id, id),
  foreign key (tenant_id, program_id) references public.programs(tenant_id, id) on delete restrict,
  foreign key (tenant_id, scope_id) references public.scopes(tenant_id, id) on delete restrict,
  foreign key (tenant_id, owner_party_id) references public.parties(tenant_id, id) on delete restrict,
  check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create table public.assessment_plan_revisions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  version_number integer not null check (version_number > 0),
  state text not null default 'draft' check (state in ('draft', 'published')),
  published_at timestamptz,
  published_by_party_id uuid,
  check ((state = 'draft' and published_at is null) or (state = 'published' and published_at is not null)),
  campaign_id uuid not null,
  ssp_revision_id uuid not null,
  oscal_document_revision_id uuid,
  title text not null check (length(btrim(title)) > 0),
  description text,
  unique (tenant_id, id),
  foreign key (tenant_id, campaign_id) references public.assessment_campaigns(tenant_id, id) on delete restrict,
  foreign key (tenant_id, ssp_revision_id) references public.ssp_revisions(tenant_id, id) on delete restrict,
  foreign key (tenant_id, published_by_party_id) references public.parties(tenant_id, id) on delete restrict,
  foreign key (oscal_document_revision_id) references public.oscal_document_revisions(id) on delete restrict,
  unique (tenant_id, campaign_id, version_number)
);

create table public.assessment_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  campaign_id uuid not null,
  plan_revision_id uuid not null,
  title text not null check (length(btrim(title)) > 0),
  description text,
  status text not null default 'planned' check (status in ('planned', 'active', 'completed', 'cancelled')),
  starts_at timestamptz,
  ends_at timestamptz,
  location text,
  unique (tenant_id, id),
  foreign key (tenant_id, campaign_id) references public.assessment_campaigns(tenant_id, id) on delete restrict,
  foreign key (tenant_id, plan_revision_id) references public.assessment_plan_revisions(tenant_id, id) on delete restrict,
  check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create table public.assessment_objectives (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  plan_revision_id uuid not null,
  title text not null check (length(btrim(title)) > 0),
  description text,
  target_control_part_id uuid,
  requirement_revision_id uuid,
  acceptance_criterion text,
  unique (tenant_id, id),
  foreign key (tenant_id, plan_revision_id) references public.assessment_plan_revisions(tenant_id, id) on delete restrict,
  foreign key (tenant_id, requirement_revision_id) references public.requirement_revisions(tenant_id, id) on delete restrict,
  foreign key (target_control_part_id) references public.control_parts(id) on delete restrict,
  unique (tenant_id, plan_revision_id, id)
);

create table public.assessment_activities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  plan_revision_id uuid not null,
  objective_id uuid,
  title text not null check (length(btrim(title)) > 0),
  description text,
  method text not null check (method in ('examine', 'interview', 'test')),
  unique (tenant_id, id),
  foreign key (tenant_id, plan_revision_id) references public.assessment_plan_revisions(tenant_id, id) on delete restrict,
  unique (tenant_id, plan_revision_id, id),
  foreign key (tenant_id, plan_revision_id, objective_id) references public.assessment_objectives(tenant_id, plan_revision_id, id)
);

create table public.activity_steps (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  plan_revision_id uuid not null,
  activity_id uuid not null,
  sequence_number integer not null check (sequence_number > 0),
  instruction text not null check (length(btrim(instruction)) > 0),
  expected_result text,
  unique (tenant_id, id),
  foreign key (tenant_id, plan_revision_id) references public.assessment_plan_revisions(tenant_id, id) on delete restrict,
  foreign key (tenant_id, plan_revision_id, activity_id) references public.assessment_activities(tenant_id, plan_revision_id, id),
  unique (tenant_id, activity_id, sequence_number)
);

create table public.scheduled_assessment_tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  plan_revision_id uuid not null,
  title text not null check (length(btrim(title)) > 0),
  description text,
  owner_party_id uuid,
  status text not null default 'planned' check (status in ('planned', 'ready', 'in_progress', 'blocked', 'completed', 'cancelled')),
  starts_at timestamptz,
  due_at timestamptz,
  unique (tenant_id, id),
  foreign key (tenant_id, plan_revision_id) references public.assessment_plan_revisions(tenant_id, id) on delete restrict,
  foreign key (tenant_id, owner_party_id) references public.parties(tenant_id, id) on delete restrict,
  unique (tenant_id, plan_revision_id, id),
  check (due_at is null or starts_at is null or due_at >= starts_at)
);

create table public.assessment_task_dependencies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  plan_revision_id uuid not null,
  task_id uuid not null,
  depends_on_task_id uuid not null,
  unique (tenant_id, id),
  foreign key (tenant_id, plan_revision_id) references public.assessment_plan_revisions(tenant_id, id) on delete restrict,
  unique (tenant_id, task_id, depends_on_task_id),
  check (task_id <> depends_on_task_id),
  foreign key (tenant_id, plan_revision_id, task_id) references public.scheduled_assessment_tasks(tenant_id, plan_revision_id, id),
  foreign key (tenant_id, plan_revision_id, depends_on_task_id) references public.scheduled_assessment_tasks(tenant_id, plan_revision_id, id)
);

create table public.task_activities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  plan_revision_id uuid not null,
  task_id uuid not null,
  activity_id uuid not null,
  unique (tenant_id, id),
  foreign key (tenant_id, plan_revision_id) references public.assessment_plan_revisions(tenant_id, id) on delete restrict,
  unique (tenant_id, task_id, activity_id),
  foreign key (tenant_id, plan_revision_id, task_id) references public.scheduled_assessment_tasks(tenant_id, plan_revision_id, id),
  foreign key (tenant_id, plan_revision_id, activity_id) references public.assessment_activities(tenant_id, plan_revision_id, id)
);

create table public.assessment_subjects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  plan_revision_id uuid not null,
  description text,
  system_id uuid,
  scope_id uuid,
  component_id uuid,
  composition_node_id uuid,
  inventory_item_id uuid,
  party_id uuid,
  unique (tenant_id, id),
  foreign key (tenant_id, plan_revision_id) references public.assessment_plan_revisions(tenant_id, id) on delete restrict,
  foreign key (tenant_id, system_id) references public.systems(tenant_id, id) on delete restrict,
  foreign key (tenant_id, scope_id) references public.scopes(tenant_id, id) on delete restrict,
  foreign key (tenant_id, component_id) references public.system_components(tenant_id, id) on delete restrict,
  foreign key (tenant_id, composition_node_id) references public.composition_nodes(tenant_id, id) on delete restrict,
  foreign key (tenant_id, inventory_item_id) references public.inventory_items(tenant_id, id) on delete restrict,
  foreign key (tenant_id, party_id) references public.parties(tenant_id, id) on delete restrict,
  check (num_nonnulls(system_id, scope_id, component_id, composition_node_id, inventory_item_id, party_id) = 1)
);

create table public.procedures (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  title text not null check (length(btrim(title)) > 0),
  description text,
  program_id uuid,
  owner_party_id uuid,
  unique (tenant_id, id),
  foreign key (tenant_id, program_id) references public.programs(tenant_id, id) on delete restrict,
  foreign key (tenant_id, owner_party_id) references public.parties(tenant_id, id) on delete restrict
);

create table public.procedure_revisions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  version_number integer not null check (version_number > 0),
  state text not null default 'draft' check (state in ('draft', 'published')),
  published_at timestamptz,
  published_by_party_id uuid,
  check ((state = 'draft' and published_at is null) or (state = 'published' and published_at is not null)),
  procedure_id uuid not null,
  title text not null check (length(btrim(title)) > 0),
  description text,
  method text not null check (method in ('examine', 'interview', 'test', 'inspection', 'analysis', 'demonstration')),
  preconditions text,
  acceptance_criterion text,
  unique (tenant_id, id),
  foreign key (tenant_id, procedure_id) references public.procedures(tenant_id, id) on delete restrict,
  foreign key (tenant_id, published_by_party_id) references public.parties(tenant_id, id) on delete restrict,
  unique (tenant_id, procedure_id, version_number)
);

create table public.procedure_steps (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  procedure_revision_id uuid not null,
  sequence_number integer not null check (sequence_number > 0),
  instruction text not null check (length(btrim(instruction)) > 0),
  expected_result text,
  unique (tenant_id, id),
  foreign key (tenant_id, procedure_revision_id) references public.procedure_revisions(tenant_id, id) on delete restrict,
  unique (tenant_id, procedure_revision_id, sequence_number),
  unique (tenant_id, procedure_revision_id, id)
);

create table public.requirement_verifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  requirement_revision_id uuid not null,
  procedure_revision_id uuid not null,
  rationale text,
  unique (tenant_id, id),
  foreign key (tenant_id, requirement_revision_id) references public.requirement_revisions(tenant_id, id) on delete restrict,
  foreign key (tenant_id, procedure_revision_id) references public.procedure_revisions(tenant_id, id) on delete restrict,
  unique (tenant_id, requirement_revision_id, procedure_revision_id)
);

create table public.test_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  title text not null check (length(btrim(title)) > 0),
  procedure_revision_id uuid not null,
  configuration_baseline_id uuid not null,
  assessment_event_id uuid,
  assessment_task_id uuid,
  assessor_party_id uuid,
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'completed', 'aborted')),
  started_at timestamptz,
  completed_at timestamptz,
  conclusion text,
  unique (tenant_id, id),
  foreign key (tenant_id, procedure_revision_id) references public.procedure_revisions(tenant_id, id) on delete restrict,
  foreign key (tenant_id, configuration_baseline_id) references public.configuration_baselines(tenant_id, id) on delete restrict,
  foreign key (tenant_id, assessment_event_id) references public.assessment_events(tenant_id, id) on delete restrict,
  foreign key (tenant_id, assessment_task_id) references public.scheduled_assessment_tasks(tenant_id, id) on delete restrict,
  foreign key (tenant_id, assessor_party_id) references public.parties(tenant_id, id) on delete restrict,
  unique (tenant_id, procedure_revision_id, id),
  check (completed_at is null or started_at is null or completed_at >= started_at),
  check (status <> 'completed' or completed_at is not null)
);

create table public.step_results (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  test_run_id uuid not null,
  procedure_revision_id uuid not null,
  procedure_step_id uuid not null,
  determination text not null check (determination in ('met', 'not_met', 'blocked', 'not_applicable')),
  observed_behavior text,
  recorded_at timestamptz,
  assessor_party_id uuid,
  unique (tenant_id, id),
  foreign key (tenant_id, assessor_party_id) references public.parties(tenant_id, id) on delete restrict,
  foreign key (tenant_id, procedure_revision_id, test_run_id) references public.test_runs(tenant_id, procedure_revision_id, id),
  foreign key (tenant_id, procedure_revision_id, procedure_step_id) references public.procedure_steps(tenant_id, procedure_revision_id, id),
  unique (tenant_id, test_run_id, procedure_step_id)
);

create table public.observations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  title text not null check (length(btrim(title)) > 0),
  description text,
  assessment_event_id uuid,
  step_result_id uuid,
  subject_id uuid,
  observer_party_id uuid,
  method text not null check (method in ('examine', 'interview', 'test', 'inspection', 'analysis', 'demonstration')),
  observed_at timestamptz,
  expires_at timestamptz,
  unique (tenant_id, id),
  foreign key (tenant_id, assessment_event_id) references public.assessment_events(tenant_id, id) on delete restrict,
  foreign key (tenant_id, step_result_id) references public.step_results(tenant_id, id) on delete restrict,
  foreign key (tenant_id, subject_id) references public.assessment_subjects(tenant_id, id) on delete restrict,
  foreign key (tenant_id, observer_party_id) references public.parties(tenant_id, id) on delete restrict,
  check (expires_at is null or observed_at is null or expires_at >= observed_at)
);

create table public.observation_evidence (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  observation_id uuid not null,
  evidence_version_id uuid not null,
  description text,
  unique (tenant_id, id),
  foreign key (tenant_id, observation_id) references public.observations(tenant_id, id) on delete restrict,
  foreign key (tenant_id, evidence_version_id) references public.evidence_versions(tenant_id, id) on delete restrict,
  unique (tenant_id, observation_id, evidence_version_id)
);

create table public.assessment_results_revisions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  version_number integer not null check (version_number > 0),
  state text not null default 'draft' check (state in ('draft', 'published')),
  published_at timestamptz,
  published_by_party_id uuid,
  check ((state = 'draft' and published_at is null) or (state = 'published' and published_at is not null)),
  assessment_plan_revision_id uuid not null,
  oscal_document_revision_id uuid,
  title text not null check (length(btrim(title)) > 0),
  description text,
  unique (tenant_id, id),
  foreign key (tenant_id, assessment_plan_revision_id) references public.assessment_plan_revisions(tenant_id, id) on delete restrict,
  foreign key (tenant_id, published_by_party_id) references public.parties(tenant_id, id) on delete restrict,
  foreign key (oscal_document_revision_id) references public.oscal_document_revisions(id) on delete restrict,
  unique (tenant_id, assessment_plan_revision_id, version_number)
);

create table public.result_sets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  assessment_results_revision_id uuid not null,
  title text not null check (length(btrim(title)) > 0),
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  unique (tenant_id, id),
  foreign key (tenant_id, assessment_results_revision_id) references public.assessment_results_revisions(tenant_id, id) on delete restrict,
  unique (tenant_id, assessment_results_revision_id, id),
  check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create table public.result_observations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  result_set_id uuid not null,
  observation_id uuid not null,
  assessment_results_revision_id uuid not null,
  unique (tenant_id, id),
  foreign key (tenant_id, result_set_id) references public.result_sets(tenant_id, id) on delete restrict,
  foreign key (tenant_id, observation_id) references public.observations(tenant_id, id) on delete restrict,
  foreign key (tenant_id, assessment_results_revision_id) references public.assessment_results_revisions(tenant_id, id) on delete restrict,
  unique (tenant_id, result_set_id, observation_id),
  foreign key (tenant_id, assessment_results_revision_id, result_set_id) references public.result_sets(tenant_id, assessment_results_revision_id, id)
);

create table public.assessment_findings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  assessment_results_revision_id uuid not null,
  result_set_id uuid not null,
  target_control_part_id uuid not null,
  title text not null check (length(btrim(title)) > 0),
  description text,
  determination text not null check (determination in ('satisfied', 'partially_satisfied', 'other_than_satisfied', 'not_assessed')),
  assessor_party_id uuid,
  determined_at timestamptz,
  unique (tenant_id, id),
  foreign key (tenant_id, assessment_results_revision_id) references public.assessment_results_revisions(tenant_id, id) on delete restrict,
  foreign key (tenant_id, assessor_party_id) references public.parties(tenant_id, id) on delete restrict,
  foreign key (target_control_part_id) references public.control_parts(id) on delete restrict,
  foreign key (tenant_id, assessment_results_revision_id, result_set_id) references public.result_sets(tenant_id, assessment_results_revision_id, id),
  unique (tenant_id, assessment_results_revision_id, id)
);

create table public.finding_observations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  finding_id uuid not null,
  observation_id uuid not null,
  assessment_results_revision_id uuid not null,
  unique (tenant_id, id),
  foreign key (tenant_id, finding_id) references public.assessment_findings(tenant_id, id) on delete restrict,
  foreign key (tenant_id, observation_id) references public.observations(tenant_id, id) on delete restrict,
  foreign key (tenant_id, assessment_results_revision_id) references public.assessment_results_revisions(tenant_id, id) on delete restrict,
  unique (tenant_id, finding_id, observation_id),
  foreign key (tenant_id, assessment_results_revision_id, finding_id) references public.assessment_findings(tenant_id, assessment_results_revision_id, id)
);

create table public.risks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  title text not null check (length(btrim(title)) > 0),
  program_id uuid not null,
  scope_id uuid,
  owner_party_id uuid,
  status text not null default 'open' check (status in ('open', 'investigating', 'responding', 'accepted', 'closed')),
  unique (tenant_id, id),
  foreign key (tenant_id, program_id) references public.programs(tenant_id, id) on delete restrict,
  foreign key (tenant_id, scope_id) references public.scopes(tenant_id, id) on delete restrict,
  foreign key (tenant_id, owner_party_id) references public.parties(tenant_id, id) on delete restrict
);

create table public.risk_revisions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  version_number integer not null check (version_number > 0),
  state text not null default 'draft' check (state in ('draft', 'published')),
  published_at timestamptz,
  published_by_party_id uuid,
  check ((state = 'draft' and published_at is null) or (state = 'published' and published_at is not null)),
  risk_id uuid not null,
  description text,
  threat text,
  vulnerability text,
  likelihood text check (likelihood is null or likelihood in ('very_low','low','moderate','high','very_high')),
  impact text check (impact is null or impact in ('very_low','low','moderate','high','very_high')),
  severity text check (severity is null or severity in ('low','moderate','high','critical')),
  assessment_rationale text,
  assessed_at timestamptz,
  assessor_party_id uuid,
  unique (tenant_id, id),
  foreign key (tenant_id, risk_id) references public.risks(tenant_id, id) on delete restrict,
  foreign key (tenant_id, assessor_party_id) references public.parties(tenant_id, id) on delete restrict,
  foreign key (tenant_id, published_by_party_id) references public.parties(tenant_id, id) on delete restrict,
  unique (tenant_id, risk_id, version_number)
);

create table public.finding_risks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  finding_id uuid not null,
  risk_revision_id uuid not null,
  assessment_results_revision_id uuid not null,
  unique (tenant_id, id),
  foreign key (tenant_id, finding_id) references public.assessment_findings(tenant_id, id) on delete restrict,
  foreign key (tenant_id, risk_revision_id) references public.risk_revisions(tenant_id, id) on delete restrict,
  foreign key (tenant_id, assessment_results_revision_id) references public.assessment_results_revisions(tenant_id, id) on delete restrict,
  unique (tenant_id, finding_id, risk_revision_id),
  foreign key (tenant_id, assessment_results_revision_id, finding_id) references public.assessment_findings(tenant_id, assessment_results_revision_id, id)
);

create table public.risk_observations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  risk_revision_id uuid not null,
  observation_id uuid not null,
  unique (tenant_id, id),
  foreign key (tenant_id, risk_revision_id) references public.risk_revisions(tenant_id, id) on delete restrict,
  foreign key (tenant_id, observation_id) references public.observations(tenant_id, id) on delete restrict,
  unique (tenant_id, risk_revision_id, observation_id)
);

create table public.risk_responses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  risk_revision_id uuid not null,
  response_type text not null check (response_type in ('mitigate', 'accept', 'transfer', 'avoid')),
  description text,
  owner_party_id uuid,
  approved_by_party_id uuid,
  approved_at timestamptz,
  due_at timestamptz,
  unique (tenant_id, id),
  foreign key (tenant_id, risk_revision_id) references public.risk_revisions(tenant_id, id) on delete restrict,
  foreign key (tenant_id, owner_party_id) references public.parties(tenant_id, id) on delete restrict,
  foreign key (tenant_id, approved_by_party_id) references public.parties(tenant_id, id) on delete restrict
);

create table public.operational_issues (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  title text not null check (length(btrim(title)) > 0),
  description text,
  program_id uuid not null,
  scope_id uuid,
  owner_party_id uuid,
  status text not null default 'open' check (status in ('open', 'triaged', 'in_progress', 'resolved', 'closed')),
  severity text check (severity is null or severity in ('low','moderate','high','critical')),
  opened_at timestamptz,
  closed_at timestamptz,
  closure_rationale text,
  unique (tenant_id, id),
  foreign key (tenant_id, program_id) references public.programs(tenant_id, id) on delete restrict,
  foreign key (tenant_id, scope_id) references public.scopes(tenant_id, id) on delete restrict,
  foreign key (tenant_id, owner_party_id) references public.parties(tenant_id, id) on delete restrict,
  check (closed_at is null or opened_at is null or closed_at >= opened_at)
);

create table public.issue_observations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  issue_id uuid not null,
  observation_id uuid not null,
  unique (tenant_id, id),
  foreign key (tenant_id, issue_id) references public.operational_issues(tenant_id, id) on delete restrict,
  foreign key (tenant_id, observation_id) references public.observations(tenant_id, id) on delete restrict,
  unique (tenant_id, issue_id, observation_id)
);

create table public.poam_documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  title text not null check (length(btrim(title)) > 0),
  program_id uuid not null,
  scope_id uuid,
  unique (tenant_id, id),
  foreign key (tenant_id, program_id) references public.programs(tenant_id, id) on delete restrict,
  foreign key (tenant_id, scope_id) references public.scopes(tenant_id, id) on delete restrict
);

create table public.poam_revisions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  version_number integer not null check (version_number > 0),
  state text not null default 'draft' check (state in ('draft', 'published')),
  published_at timestamptz,
  published_by_party_id uuid,
  check ((state = 'draft' and published_at is null) or (state = 'published' and published_at is not null)),
  poam_document_id uuid not null,
  ssp_revision_id uuid,
  oscal_document_revision_id uuid,
  description text,
  unique (tenant_id, id),
  foreign key (tenant_id, poam_document_id) references public.poam_documents(tenant_id, id) on delete restrict,
  foreign key (tenant_id, ssp_revision_id) references public.ssp_revisions(tenant_id, id) on delete restrict,
  foreign key (tenant_id, published_by_party_id) references public.parties(tenant_id, id) on delete restrict,
  foreign key (oscal_document_revision_id) references public.oscal_document_revisions(id) on delete restrict,
  unique (tenant_id, poam_document_id, version_number),
  unique (tenant_id, poam_document_id, id)
);

create table public.poam_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  poam_document_id uuid not null,
  title text not null check (length(btrim(title)) > 0),
  owner_party_id uuid,
  status text not null default 'open' check (status in ('open', 'in_progress', 'completed', 'risk_accepted', 'cancelled')),
  unique (tenant_id, id),
  foreign key (tenant_id, poam_document_id) references public.poam_documents(tenant_id, id) on delete restrict,
  foreign key (tenant_id, owner_party_id) references public.parties(tenant_id, id) on delete restrict,
  unique (tenant_id, poam_document_id, id)
);

create table public.poam_item_revisions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  version_number integer not null check (version_number > 0),
  state text not null default 'draft' check (state in ('draft', 'published')),
  published_at timestamptz,
  published_by_party_id uuid,
  check ((state = 'draft' and published_at is null) or (state = 'published' and published_at is not null)),
  poam_document_id uuid not null,
  poam_item_id uuid not null,
  description text,
  remediation_plan text,
  resources text,
  planned_completion_date date,
  actual_completion_date date,
  completion_rationale text,
  unique (tenant_id, id),
  foreign key (tenant_id, poam_document_id) references public.poam_documents(tenant_id, id) on delete restrict,
  foreign key (tenant_id, published_by_party_id) references public.parties(tenant_id, id) on delete restrict,
  unique (tenant_id, poam_item_id, version_number),
  foreign key (tenant_id, poam_document_id, poam_item_id) references public.poam_items(tenant_id, poam_document_id, id),
  unique (tenant_id, poam_document_id, id)
);

create table public.poam_item_risks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  poam_item_revision_id uuid not null,
  risk_revision_id uuid not null,
  unique (tenant_id, id),
  foreign key (tenant_id, poam_item_revision_id) references public.poam_item_revisions(tenant_id, id) on delete restrict,
  foreign key (tenant_id, risk_revision_id) references public.risk_revisions(tenant_id, id) on delete restrict,
  unique (tenant_id, poam_item_revision_id, risk_revision_id)
);

create table public.poam_item_observations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  poam_item_revision_id uuid not null,
  observation_id uuid not null,
  unique (tenant_id, id),
  foreign key (tenant_id, poam_item_revision_id) references public.poam_item_revisions(tenant_id, id) on delete restrict,
  foreign key (tenant_id, observation_id) references public.observations(tenant_id, id) on delete restrict,
  unique (tenant_id, poam_item_revision_id, observation_id)
);

create table public.poam_milestones (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  poam_item_revision_id uuid not null,
  title text not null check (length(btrim(title)) > 0),
  description text,
  sequence_number integer check (sequence_number is null or sequence_number > 0),
  owner_party_id uuid,
  planned_date date,
  completed_date date,
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'completed', 'cancelled')),
  unique (tenant_id, id),
  foreign key (tenant_id, poam_item_revision_id) references public.poam_item_revisions(tenant_id, id) on delete restrict,
  foreign key (tenant_id, owner_party_id) references public.parties(tenant_id, id) on delete restrict,
  check (status <> 'completed' or completed_date is not null)
);

create table public.issue_poams (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  issue_id uuid not null,
  poam_item_id uuid not null,
  unique (tenant_id, id),
  foreign key (tenant_id, issue_id) references public.operational_issues(tenant_id, id) on delete restrict,
  foreign key (tenant_id, poam_item_id) references public.poam_items(tenant_id, id) on delete restrict,
  unique (tenant_id, issue_id, poam_item_id)
);

create table public.workstreams (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  program_id uuid not null,
  title text not null check (length(btrim(title)) > 0),
  description text,
  owner_party_id uuid,
  status text not null default 'planned' check (status in ('planned', 'active', 'completed', 'cancelled')),
  starts_on date,
  ends_on date,
  unique (tenant_id, id),
  foreign key (tenant_id, program_id) references public.programs(tenant_id, id) on delete restrict,
  foreign key (tenant_id, owner_party_id) references public.parties(tenant_id, id) on delete restrict,
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  program_id uuid not null,
  workstream_id uuid,
  title text not null check (length(btrim(title)) > 0),
  description text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'waiting', 'blocked', 'done', 'cancelled')),
  priority text check (priority is null or priority in ('low','normal','high','urgent')),
  due_at timestamptz,
  completed_at timestamptz,
  unique (tenant_id, id),
  foreign key (tenant_id, program_id) references public.programs(tenant_id, id) on delete restrict,
  foreign key (tenant_id, workstream_id) references public.workstreams(tenant_id, id) on delete restrict,
  check (status <> 'done' or completed_at is not null)
);

create table public.task_assignments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  task_id uuid not null,
  party_id uuid not null,
  assignment_role text not null check (assignment_role in ('accountable', 'responsible', 'consulted', 'informed')),
  unique (tenant_id, id),
  foreign key (tenant_id, task_id) references public.tasks(tenant_id, id) on delete restrict,
  foreign key (tenant_id, party_id) references public.parties(tenant_id, id) on delete restrict,
  unique (tenant_id, task_id, party_id)
);

create table public.task_requirements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  task_id uuid not null,
  requirement_revision_id uuid not null,
  unique (tenant_id, id),
  foreign key (tenant_id, task_id) references public.tasks(tenant_id, id) on delete restrict,
  foreign key (tenant_id, requirement_revision_id) references public.requirement_revisions(tenant_id, id) on delete restrict,
  unique (tenant_id, task_id, requirement_revision_id)
);

create table public.task_implementations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  task_id uuid not null,
  implemented_requirement_id uuid not null,
  unique (tenant_id, id),
  foreign key (tenant_id, task_id) references public.tasks(tenant_id, id) on delete restrict,
  foreign key (tenant_id, implemented_requirement_id) references public.implemented_requirements(tenant_id, id) on delete restrict,
  unique (tenant_id, task_id, implemented_requirement_id)
);

create table public.task_issues (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  task_id uuid not null,
  issue_id uuid not null,
  unique (tenant_id, id),
  foreign key (tenant_id, task_id) references public.tasks(tenant_id, id) on delete restrict,
  foreign key (tenant_id, issue_id) references public.operational_issues(tenant_id, id) on delete restrict,
  unique (tenant_id, task_id, issue_id)
);

create table public.task_risks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  task_id uuid not null,
  risk_id uuid not null,
  unique (tenant_id, id),
  foreign key (tenant_id, task_id) references public.tasks(tenant_id, id) on delete restrict,
  foreign key (tenant_id, risk_id) references public.risks(tenant_id, id) on delete restrict,
  unique (tenant_id, task_id, risk_id)
);

create table public.task_poams (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  task_id uuid not null,
  poam_item_id uuid not null,
  unique (tenant_id, id),
  foreign key (tenant_id, task_id) references public.tasks(tenant_id, id) on delete restrict,
  foreign key (tenant_id, poam_item_id) references public.poam_items(tenant_id, id) on delete restrict,
  unique (tenant_id, task_id, poam_item_id)
);

create table public.task_assessments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  task_id uuid not null,
  assessment_task_id uuid not null,
  unique (tenant_id, id),
  foreign key (tenant_id, task_id) references public.tasks(tenant_id, id) on delete restrict,
  foreign key (tenant_id, assessment_task_id) references public.scheduled_assessment_tasks(tenant_id, id) on delete restrict,
  unique (tenant_id, task_id, assessment_task_id)
);

create table public.lifecycle_gates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  program_id uuid not null,
  title text not null check (length(btrim(title)) > 0),
  description text,
  sequence_number integer check (sequence_number is null or sequence_number > 0),
  status text not null default 'not_started' check (status in ('not_started', 'in_review', 'passed', 'failed', 'waived')),
  due_on date,
  decided_at timestamptz,
  unique (tenant_id, id),
  foreign key (tenant_id, program_id) references public.programs(tenant_id, id) on delete restrict
);

create table public.gate_criteria (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  gate_id uuid not null,
  title text not null check (length(btrim(title)) > 0),
  description text,
  required boolean not null default true,
  sequence_number integer check (sequence_number is null or sequence_number > 0),
  unique (tenant_id, id),
  foreign key (tenant_id, gate_id) references public.lifecycle_gates(tenant_id, id) on delete restrict
);

create table public.authorization_packages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  program_id uuid not null,
  system_id uuid not null,
  title text not null check (length(btrim(title)) > 0),
  owner_party_id uuid,
  unique (tenant_id, id),
  foreign key (tenant_id, program_id) references public.programs(tenant_id, id) on delete restrict,
  foreign key (tenant_id, system_id) references public.systems(tenant_id, id) on delete restrict,
  foreign key (tenant_id, owner_party_id) references public.parties(tenant_id, id) on delete restrict
);

create table public.package_revisions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  version_number integer not null check (version_number > 0),
  state text not null default 'draft' check (state in ('draft', 'published')),
  published_at timestamptz,
  published_by_party_id uuid,
  check ((state = 'draft' and published_at is null) or (state = 'published' and published_at is not null)),
  package_id uuid not null,
  description text,
  submitted_at timestamptz,
  unique (tenant_id, id),
  foreign key (tenant_id, package_id) references public.authorization_packages(tenant_id, id) on delete restrict,
  foreign key (tenant_id, published_by_party_id) references public.parties(tenant_id, id) on delete restrict,
  unique (tenant_id, package_id, version_number)
);

create table public.package_documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  package_revision_id uuid not null,
  title text not null check (length(btrim(title)) > 0),
  ssp_revision_id uuid,
  assessment_plan_revision_id uuid,
  assessment_results_revision_id uuid,
  poam_revision_id uuid,
  evidence_version_id uuid,
  unique (tenant_id, id),
  foreign key (tenant_id, package_revision_id) references public.package_revisions(tenant_id, id) on delete restrict,
  foreign key (tenant_id, ssp_revision_id) references public.ssp_revisions(tenant_id, id) on delete restrict,
  foreign key (tenant_id, assessment_plan_revision_id) references public.assessment_plan_revisions(tenant_id, id) on delete restrict,
  foreign key (tenant_id, assessment_results_revision_id) references public.assessment_results_revisions(tenant_id, id) on delete restrict,
  foreign key (tenant_id, poam_revision_id) references public.poam_revisions(tenant_id, id) on delete restrict,
  foreign key (tenant_id, evidence_version_id) references public.evidence_versions(tenant_id, id) on delete restrict,
  check (num_nonnulls(ssp_revision_id, assessment_plan_revision_id, assessment_results_revision_id, poam_revision_id, evidence_version_id) = 1)
);

create table public.authorization_decisions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  package_revision_id uuid not null,
  decision_maker_party_id uuid not null,
  decision text not null check (decision in ('authorized', 'authorized_with_conditions', 'denied', 'revoked')),
  rationale text not null check (length(btrim(rationale)) > 0),
  decided_at timestamptz not null,
  effective_on date,
  expires_on date,
  conditions text,
  unique (tenant_id, id),
  foreign key (tenant_id, package_revision_id) references public.package_revisions(tenant_id, id) on delete restrict,
  foreign key (tenant_id, decision_maker_party_id) references public.parties(tenant_id, id) on delete restrict,
  check (expires_on is null or effective_on is null or expires_on >= effective_on)
);

create table public.review_decisions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  gate_criterion_id uuid,
  package_revision_id uuid,
  evidence_version_id uuid,
  risk_revision_id uuid,
  reviewer_party_id uuid not null,
  decision text not null check (decision in ('accepted', 'changes_requested', 'rejected', 'waived')),
  rationale text not null check (length(btrim(rationale)) > 0),
  decided_at timestamptz not null,
  unique (tenant_id, id),
  foreign key (tenant_id, gate_criterion_id) references public.gate_criteria(tenant_id, id) on delete restrict,
  foreign key (tenant_id, package_revision_id) references public.package_revisions(tenant_id, id) on delete restrict,
  foreign key (tenant_id, evidence_version_id) references public.evidence_versions(tenant_id, id) on delete restrict,
  foreign key (tenant_id, risk_revision_id) references public.risk_revisions(tenant_id, id) on delete restrict,
  foreign key (tenant_id, reviewer_party_id) references public.parties(tenant_id, id) on delete restrict,
  check (num_nonnulls(gate_criterion_id, package_revision_id, evidence_version_id, risk_revision_id) = 1)
);

create table public.requirement_evidence (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  requirement_revision_id uuid not null,
  evidence_version_id uuid not null,
  claim text,
  applicability_rationale text,
  unique (tenant_id, id),
  foreign key (tenant_id, requirement_revision_id) references public.requirement_revisions(tenant_id, id) on delete restrict,
  foreign key (tenant_id, evidence_version_id) references public.evidence_versions(tenant_id, id) on delete restrict,
  unique (tenant_id, requirement_revision_id, evidence_version_id)
);

create table public.implementation_evidence (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  implementation_statement_id uuid not null,
  evidence_version_id uuid not null,
  claim text,
  applicability_rationale text,
  unique (tenant_id, id),
  foreign key (tenant_id, implementation_statement_id) references public.implementation_statements(tenant_id, id) on delete restrict,
  foreign key (tenant_id, evidence_version_id) references public.evidence_versions(tenant_id, id) on delete restrict,
  unique (tenant_id, implementation_statement_id, evidence_version_id)
);

create table public.finding_evidence (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  finding_id uuid not null,
  evidence_version_id uuid not null,
  claim text,
  applicability_rationale text,
  unique (tenant_id, id),
  foreign key (tenant_id, finding_id) references public.assessment_findings(tenant_id, id) on delete restrict,
  foreign key (tenant_id, evidence_version_id) references public.evidence_versions(tenant_id, id) on delete restrict,
  unique (tenant_id, finding_id, evidence_version_id)
);

create table public.test_run_evidence (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  test_run_id uuid not null,
  evidence_version_id uuid not null,
  claim text,
  applicability_rationale text,
  unique (tenant_id, id),
  foreign key (tenant_id, test_run_id) references public.test_runs(tenant_id, id) on delete restrict,
  foreign key (tenant_id, evidence_version_id) references public.evidence_versions(tenant_id, id) on delete restrict,
  unique (tenant_id, test_run_id, evidence_version_id)
);

create table public.step_result_evidence (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  step_result_id uuid not null,
  evidence_version_id uuid not null,
  claim text,
  applicability_rationale text,
  unique (tenant_id, id),
  foreign key (tenant_id, step_result_id) references public.step_results(tenant_id, id) on delete restrict,
  foreign key (tenant_id, evidence_version_id) references public.evidence_versions(tenant_id, id) on delete restrict,
  unique (tenant_id, step_result_id, evidence_version_id)
);

create table public.task_evidence (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  task_id uuid not null,
  evidence_version_id uuid not null,
  claim text,
  applicability_rationale text,
  unique (tenant_id, id),
  foreign key (tenant_id, task_id) references public.tasks(tenant_id, id) on delete restrict,
  foreign key (tenant_id, evidence_version_id) references public.evidence_versions(tenant_id, id) on delete restrict,
  unique (tenant_id, task_id, evidence_version_id)
);

create table public.issue_evidence (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  issue_id uuid not null,
  evidence_version_id uuid not null,
  claim text,
  applicability_rationale text,
  unique (tenant_id, id),
  foreign key (tenant_id, issue_id) references public.operational_issues(tenant_id, id) on delete restrict,
  foreign key (tenant_id, evidence_version_id) references public.evidence_versions(tenant_id, id) on delete restrict,
  unique (tenant_id, issue_id, evidence_version_id)
);

create table public.gate_evidence (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  gate_criterion_id uuid not null,
  evidence_version_id uuid not null,
  claim text,
  applicability_rationale text,
  unique (tenant_id, id),
  foreign key (tenant_id, gate_criterion_id) references public.gate_criteria(tenant_id, id) on delete restrict,
  foreign key (tenant_id, evidence_version_id) references public.evidence_versions(tenant_id, id) on delete restrict,
  unique (tenant_id, gate_criterion_id, evidence_version_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  program_id uuid,
  task_id uuid,
  issue_id uuid,
  risk_id uuid,
  poam_item_id uuid,
  assessment_campaign_id uuid,
  evidence_artifact_id uuid,
  package_id uuid,
  author_party_id uuid not null,
  body text not null check (length(btrim(body)) > 0),
  unique (tenant_id, id),
  foreign key (tenant_id, program_id) references public.programs(tenant_id, id) on delete restrict,
  foreign key (tenant_id, task_id) references public.tasks(tenant_id, id) on delete restrict,
  foreign key (tenant_id, issue_id) references public.operational_issues(tenant_id, id) on delete restrict,
  foreign key (tenant_id, risk_id) references public.risks(tenant_id, id) on delete restrict,
  foreign key (tenant_id, poam_item_id) references public.poam_items(tenant_id, id) on delete restrict,
  foreign key (tenant_id, assessment_campaign_id) references public.assessment_campaigns(tenant_id, id) on delete restrict,
  foreign key (tenant_id, evidence_artifact_id) references public.evidence_artifacts(tenant_id, id) on delete restrict,
  foreign key (tenant_id, package_id) references public.authorization_packages(tenant_id, id) on delete restrict,
  foreign key (tenant_id, author_party_id) references public.parties(tenant_id, id) on delete restrict,
  check (num_nonnulls(program_id, task_id, issue_id, risk_id, poam_item_id, assessment_campaign_id, evidence_artifact_id, package_id) = 1)
);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  program_id uuid,
  task_id uuid,
  issue_id uuid,
  risk_id uuid,
  poam_item_id uuid,
  assessment_campaign_id uuid,
  evidence_artifact_id uuid,
  package_id uuid,
  actor_party_id uuid,
  event_type text not null check (event_type in ('created', 'updated', 'published', 'reviewed', 'completed', 'reopened', 'imported', 'linked', 'unlinked')),
  description text,
  occurred_at timestamptz not null,
  unique (tenant_id, id),
  foreign key (tenant_id, program_id) references public.programs(tenant_id, id) on delete restrict,
  foreign key (tenant_id, task_id) references public.tasks(tenant_id, id) on delete restrict,
  foreign key (tenant_id, issue_id) references public.operational_issues(tenant_id, id) on delete restrict,
  foreign key (tenant_id, risk_id) references public.risks(tenant_id, id) on delete restrict,
  foreign key (tenant_id, poam_item_id) references public.poam_items(tenant_id, id) on delete restrict,
  foreign key (tenant_id, assessment_campaign_id) references public.assessment_campaigns(tenant_id, id) on delete restrict,
  foreign key (tenant_id, evidence_artifact_id) references public.evidence_artifacts(tenant_id, id) on delete restrict,
  foreign key (tenant_id, package_id) references public.authorization_packages(tenant_id, id) on delete restrict,
  foreign key (tenant_id, actor_party_id) references public.parties(tenant_id, id) on delete restrict,
  check (num_nonnulls(program_id, task_id, issue_id, risk_id, poam_item_id, assessment_campaign_id, evidence_artifact_id, package_id) = 1)
);

create table public.change_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  title text not null check (length(btrim(title)) > 0),
  description text,
  requester_party_id uuid,
  reviewer_party_id uuid,
  status text not null default 'open' check (status in ('open', 'in_review', 'approved', 'rejected', 'implemented')),
  requested_at timestamptz,
  resolved_at timestamptz,
  resolution text,
  ssp_revision_id uuid,
  requirement_revision_id uuid,
  procedure_revision_id uuid,
  assessment_plan_revision_id uuid,
  risk_revision_id uuid,
  poam_item_revision_id uuid,
  unique (tenant_id, id),
  foreign key (tenant_id, requester_party_id) references public.parties(tenant_id, id) on delete restrict,
  foreign key (tenant_id, reviewer_party_id) references public.parties(tenant_id, id) on delete restrict,
  foreign key (tenant_id, ssp_revision_id) references public.ssp_revisions(tenant_id, id) on delete restrict,
  foreign key (tenant_id, requirement_revision_id) references public.requirement_revisions(tenant_id, id) on delete restrict,
  foreign key (tenant_id, procedure_revision_id) references public.procedure_revisions(tenant_id, id) on delete restrict,
  foreign key (tenant_id, assessment_plan_revision_id) references public.assessment_plan_revisions(tenant_id, id) on delete restrict,
  foreign key (tenant_id, risk_revision_id) references public.risk_revisions(tenant_id, id) on delete restrict,
  foreign key (tenant_id, poam_item_revision_id) references public.poam_item_revisions(tenant_id, id) on delete restrict,
  check (num_nonnulls(ssp_revision_id, requirement_revision_id, procedure_revision_id, assessment_plan_revision_id, risk_revision_id, poam_item_revision_id) = 1)
);

create table public.ingestion_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  title text not null check (length(btrim(title)) > 0),
  program_id uuid,
  source_uri text,
  source_media_type text,
  source_sha256 text check (source_sha256 is null or source_sha256 ~ '^[a-fA-F0-9]{64}$'),
  status text not null default 'queued' check (status in ('queued', 'validating', 'ready', 'importing', 'completed', 'failed', 'cancelled')),
  requested_by_party_id uuid,
  started_at timestamptz,
  completed_at timestamptz,
  oscal_document_revision_id uuid,
  summary text,
  unique (tenant_id, id),
  foreign key (tenant_id, program_id) references public.programs(tenant_id, id) on delete restrict,
  foreign key (tenant_id, requested_by_party_id) references public.parties(tenant_id, id) on delete restrict,
  foreign key (oscal_document_revision_id) references public.oscal_document_revisions(id) on delete restrict,
  check (completed_at is null or started_at is null or completed_at >= started_at)
);

create table public.import_issues (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  ingestion_job_id uuid not null,
  severity text not null check (severity in ('information', 'warning', 'error')),
  code text,
  source_pointer text,
  message text not null check (length(btrim(message)) > 0),
  resolved_at timestamptz,
  resolution text,
  unique (tenant_id, id),
  foreign key (tenant_id, ingestion_job_id) references public.ingestion_jobs(tenant_id, id) on delete restrict
);

-- Uniform row permissions, optimistic concurrency and audit metadata.

select public.apply_tenant_security('evidence_artifacts');
select public.attach_record_lifecycle('evidence_artifacts', false);

select public.apply_tenant_security('evidence_versions');
select public.attach_record_lifecycle('evidence_versions', true);

select public.apply_tenant_security('evidence_reviews');
select public.attach_record_lifecycle('evidence_reviews', false);

select public.apply_tenant_security('assessment_campaigns');
select public.attach_record_lifecycle('assessment_campaigns', false);

select public.apply_tenant_security('assessment_plan_revisions');
select public.attach_record_lifecycle('assessment_plan_revisions', true);

select public.apply_tenant_security('assessment_events');
select public.attach_record_lifecycle('assessment_events', false);

select public.apply_tenant_security('assessment_objectives');
select public.attach_record_lifecycle('assessment_objectives', false);

select public.apply_tenant_security('assessment_activities');
select public.attach_record_lifecycle('assessment_activities', false);

select public.apply_tenant_security('activity_steps');
select public.attach_record_lifecycle('activity_steps', false);

select public.apply_tenant_security('scheduled_assessment_tasks');
select public.attach_record_lifecycle('scheduled_assessment_tasks', false);

select public.apply_tenant_security('assessment_task_dependencies');
select public.attach_record_lifecycle('assessment_task_dependencies', false);

select public.apply_tenant_security('task_activities');
select public.attach_record_lifecycle('task_activities', false);

select public.apply_tenant_security('assessment_subjects');
select public.attach_record_lifecycle('assessment_subjects', false);

select public.apply_tenant_security('procedures');
select public.attach_record_lifecycle('procedures', false);

select public.apply_tenant_security('procedure_revisions');
select public.attach_record_lifecycle('procedure_revisions', true);

select public.apply_tenant_security('procedure_steps');
select public.attach_record_lifecycle('procedure_steps', false);

select public.apply_tenant_security('requirement_verifications');
select public.attach_record_lifecycle('requirement_verifications', false);

select public.apply_tenant_security('test_runs');
select public.attach_record_lifecycle('test_runs', false);

select public.apply_tenant_security('step_results');
select public.attach_record_lifecycle('step_results', false);

select public.apply_tenant_security('observations');
select public.attach_record_lifecycle('observations', false);

select public.apply_tenant_security('observation_evidence');
select public.attach_record_lifecycle('observation_evidence', false);

select public.apply_tenant_security('assessment_results_revisions');
select public.attach_record_lifecycle('assessment_results_revisions', true);

select public.apply_tenant_security('result_sets');
select public.attach_record_lifecycle('result_sets', false);

select public.apply_tenant_security('result_observations');
select public.attach_record_lifecycle('result_observations', false);

select public.apply_tenant_security('assessment_findings');
select public.attach_record_lifecycle('assessment_findings', false);

select public.apply_tenant_security('finding_observations');
select public.attach_record_lifecycle('finding_observations', false);

select public.apply_tenant_security('risks');
select public.attach_record_lifecycle('risks', false);

select public.apply_tenant_security('risk_revisions');
select public.attach_record_lifecycle('risk_revisions', true);

select public.apply_tenant_security('finding_risks');
select public.attach_record_lifecycle('finding_risks', false);

select public.apply_tenant_security('risk_observations');
select public.attach_record_lifecycle('risk_observations', false);

select public.apply_tenant_security('risk_responses');
select public.attach_record_lifecycle('risk_responses', false);

select public.apply_tenant_security('operational_issues');
select public.attach_record_lifecycle('operational_issues', false);

select public.apply_tenant_security('issue_observations');
select public.attach_record_lifecycle('issue_observations', false);

select public.apply_tenant_security('poam_documents');
select public.attach_record_lifecycle('poam_documents', false);

select public.apply_tenant_security('poam_revisions');
select public.attach_record_lifecycle('poam_revisions', true);

select public.apply_tenant_security('poam_items');
select public.attach_record_lifecycle('poam_items', false);

select public.apply_tenant_security('poam_item_revisions');
select public.attach_record_lifecycle('poam_item_revisions', true);

select public.apply_tenant_security('poam_item_risks');
select public.attach_record_lifecycle('poam_item_risks', false);

select public.apply_tenant_security('poam_item_observations');
select public.attach_record_lifecycle('poam_item_observations', false);

select public.apply_tenant_security('poam_milestones');
select public.attach_record_lifecycle('poam_milestones', false);

select public.apply_tenant_security('issue_poams');
select public.attach_record_lifecycle('issue_poams', false);

select public.apply_tenant_security('workstreams');
select public.attach_record_lifecycle('workstreams', false);

select public.apply_tenant_security('tasks');
select public.attach_record_lifecycle('tasks', false);

select public.apply_tenant_security('task_assignments');
select public.attach_record_lifecycle('task_assignments', false);

select public.apply_tenant_security('task_requirements');
select public.attach_record_lifecycle('task_requirements', false);

select public.apply_tenant_security('task_implementations');
select public.attach_record_lifecycle('task_implementations', false);

select public.apply_tenant_security('task_issues');
select public.attach_record_lifecycle('task_issues', false);

select public.apply_tenant_security('task_risks');
select public.attach_record_lifecycle('task_risks', false);

select public.apply_tenant_security('task_poams');
select public.attach_record_lifecycle('task_poams', false);

select public.apply_tenant_security('task_assessments');
select public.attach_record_lifecycle('task_assessments', false);

select public.apply_tenant_security('lifecycle_gates');
select public.attach_record_lifecycle('lifecycle_gates', false);

select public.apply_tenant_security('gate_criteria');
select public.attach_record_lifecycle('gate_criteria', false);

select public.apply_tenant_security('authorization_packages');
select public.attach_record_lifecycle('authorization_packages', false);

select public.apply_tenant_security('package_revisions');
select public.attach_record_lifecycle('package_revisions', true);

select public.apply_tenant_security('package_documents');
select public.attach_record_lifecycle('package_documents', false);

select public.apply_tenant_security('authorization_decisions');
select public.attach_record_lifecycle('authorization_decisions', false);

select public.apply_tenant_security('review_decisions');
select public.attach_record_lifecycle('review_decisions', false);

select public.apply_tenant_security('requirement_evidence');
select public.attach_record_lifecycle('requirement_evidence', false);

select public.apply_tenant_security('implementation_evidence');
select public.attach_record_lifecycle('implementation_evidence', false);

select public.apply_tenant_security('finding_evidence');
select public.attach_record_lifecycle('finding_evidence', false);

select public.apply_tenant_security('test_run_evidence');
select public.attach_record_lifecycle('test_run_evidence', false);

select public.apply_tenant_security('step_result_evidence');
select public.attach_record_lifecycle('step_result_evidence', false);

select public.apply_tenant_security('task_evidence');
select public.attach_record_lifecycle('task_evidence', false);

select public.apply_tenant_security('issue_evidence');
select public.attach_record_lifecycle('issue_evidence', false);

select public.apply_tenant_security('gate_evidence');
select public.attach_record_lifecycle('gate_evidence', false);

select public.apply_tenant_security('comments');
select public.attach_record_lifecycle('comments', false);

select public.apply_tenant_security('activity_events');
select public.attach_record_lifecycle('activity_events', false);

select public.apply_tenant_security('change_requests');
select public.attach_record_lifecycle('change_requests', false);

select public.apply_tenant_security('ingestion_jobs');
select public.attach_record_lifecycle('ingestion_jobs', false);

select public.apply_tenant_security('import_issues');
select public.attach_record_lifecycle('import_issues', false);

select public.attach_reference_tenant_guard('assessment_plan_revisions', 'oscal_document_revision_id', 'oscal_document_revisions');

select public.attach_reference_tenant_guard('assessment_objectives', 'target_control_part_id', 'control_parts');

select public.attach_reference_tenant_guard('assessment_results_revisions', 'oscal_document_revision_id', 'oscal_document_revisions');

select public.attach_reference_tenant_guard('assessment_findings', 'target_control_part_id', 'control_parts');

select public.attach_reference_tenant_guard('poam_revisions', 'oscal_document_revision_id', 'oscal_document_revisions');

select public.attach_reference_tenant_guard('ingestion_jobs', 'oscal_document_revision_id', 'oscal_document_revisions');

select public.attach_parent_immutability('assessment_objectives', 'assessment_plan_revisions', 'plan_revision_id');

select public.attach_parent_immutability('assessment_activities', 'assessment_plan_revisions', 'plan_revision_id');

select public.attach_parent_immutability('activity_steps', 'assessment_plan_revisions', 'plan_revision_id');

select public.attach_parent_immutability('scheduled_assessment_tasks', 'assessment_plan_revisions', 'plan_revision_id');

select public.attach_parent_immutability('assessment_task_dependencies', 'assessment_plan_revisions', 'plan_revision_id');

select public.attach_parent_immutability('task_activities', 'assessment_plan_revisions', 'plan_revision_id');

select public.attach_parent_immutability('assessment_subjects', 'assessment_plan_revisions', 'plan_revision_id');

select public.attach_parent_immutability('procedure_steps', 'procedure_revisions', 'procedure_revision_id');

select public.attach_parent_immutability('result_sets', 'assessment_results_revisions', 'assessment_results_revision_id');

select public.attach_parent_immutability('result_observations', 'assessment_results_revisions', 'assessment_results_revision_id');

select public.attach_parent_immutability('assessment_findings', 'assessment_results_revisions', 'assessment_results_revision_id');

select public.attach_parent_immutability('finding_observations', 'assessment_results_revisions', 'assessment_results_revision_id');

select public.attach_parent_immutability('finding_risks', 'assessment_results_revisions', 'assessment_results_revision_id');

select public.attach_parent_immutability('risk_observations', 'risk_revisions', 'risk_revision_id');

select public.attach_parent_immutability('risk_responses', 'risk_revisions', 'risk_revision_id');


select public.attach_parent_immutability('poam_item_risks', 'poam_item_revisions', 'poam_item_revision_id');

select public.attach_parent_immutability('poam_item_observations', 'poam_item_revisions', 'poam_item_revision_id');

select public.attach_parent_immutability('poam_milestones', 'poam_item_revisions', 'poam_item_revision_id');

select public.attach_parent_immutability('package_documents', 'package_revisions', 'package_revision_id');

-- Keep campaign/task links inside the exact plan they describe.
alter table public.assessment_plan_revisions add unique (tenant_id, campaign_id, id);
alter table public.assessment_events add foreign key (tenant_id, campaign_id, plan_revision_id)
  references public.assessment_plan_revisions(tenant_id, campaign_id, id);
alter table public.assessment_events add unique (tenant_id, plan_revision_id, id);
alter table public.test_runs add column plan_revision_id uuid;
alter table public.test_runs add foreign key (tenant_id, plan_revision_id) references public.assessment_plan_revisions(tenant_id, id);
alter table public.test_runs add foreign key (tenant_id, plan_revision_id, assessment_task_id)
  references public.scheduled_assessment_tasks(tenant_id, plan_revision_id, id);
alter table public.test_runs add foreign key (tenant_id, plan_revision_id, assessment_event_id)
  references public.assessment_events(tenant_id, plan_revision_id, id);
alter table public.test_runs add check ((assessment_task_id is null and assessment_event_id is null) or plan_revision_id is not null);

-- A completed execution is historical, including its recorded step outcomes.
create function public.guard_completed_execution() returns trigger
language plpgsql set search_path = '' as $$
declare run_id uuid; run_status text; row_value jsonb;
begin
  if tg_table_name = 'test_runs' then
    if old.status in ('completed', 'aborted') then
      raise exception 'Completed executions are immutable; create a retest run' using errcode = '23514';
    end if;
  else
    if tg_op <> 'INSERT' then
      row_value := to_jsonb(old);
      run_id := (row_value->>'test_run_id')::uuid;
      if tg_table_name = 'step_result_evidence' then
        select test_run_id into run_id from public.step_results where id = (row_value->>'step_result_id')::uuid;
      end if;
      select status into run_status from public.test_runs where id = run_id for share;
      if run_status in ('completed', 'aborted') then
        raise exception 'Completed execution content is immutable' using errcode = '23514';
      end if;
    end if;
    if tg_op <> 'DELETE' then
      row_value := to_jsonb(new);
      run_id := (row_value->>'test_run_id')::uuid;
      if tg_table_name = 'step_result_evidence' then
        select test_run_id into run_id from public.step_results where id = (row_value->>'step_result_id')::uuid;
      end if;
      select status into run_status from public.test_runs where id = run_id for share;
      if run_status in ('completed', 'aborted') then
        raise exception 'Content cannot be attached to a completed execution' using errcode = '23514';
      end if;
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function public.guard_completed_execution() from public, anon, authenticated;
create trigger completed_execution before update or delete on public.test_runs for each row execute function public.guard_completed_execution();
create trigger completed_execution before insert or update or delete on public.step_results for each row execute function public.guard_completed_execution();
create trigger completed_execution before insert or update or delete on public.step_result_evidence for each row execute function public.guard_completed_execution();
create trigger completed_execution before insert or update or delete on public.test_run_evidence for each row execute function public.guard_completed_execution();

-- Pins used by executions/documents must already be immutable publications.
create function public.require_published_workflow_reference() returns trigger
language plpgsql set search_path = '' as $$
declare target_id uuid; target_state text;
begin
  target_id := (to_jsonb(new)->>tg_argv[1])::uuid;
  if target_id is null then return new; end if;
  execute format('select state from public.%I where id = $1 for share', tg_argv[0]) into target_state using target_id;
  if target_state is distinct from 'published' then
    raise exception 'Referenced % must be published first', tg_argv[0] using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.require_published_workflow_reference() from public, anon, authenticated;
create trigger published_procedure_revision_id before insert or update on public.test_runs for each row execute function public.require_published_workflow_reference('procedure_revisions', 'procedure_revision_id');
create trigger published_configuration_baseline_id before insert or update on public.test_runs for each row execute function public.require_published_workflow_reference('configuration_baselines', 'configuration_baseline_id');
create trigger published_ssp_revision_id before insert or update on public.assessment_plan_revisions for each row execute function public.require_published_workflow_reference('ssp_revisions', 'ssp_revision_id');
create trigger published_assessment_plan_revision_id before insert or update on public.assessment_results_revisions for each row execute function public.require_published_workflow_reference('assessment_plan_revisions', 'assessment_plan_revision_id');
create trigger published_risk_revision_id before insert or update on public.finding_risks for each row execute function public.require_published_workflow_reference('risk_revisions', 'risk_revision_id');
create trigger published_risk_revision_id before insert or update on public.poam_item_risks for each row execute function public.require_published_workflow_reference('risk_revisions', 'risk_revision_id');
create trigger published_package_revision_id before insert or update on public.authorization_decisions for each row execute function public.require_published_workflow_reference('package_revisions', 'package_revision_id');
create trigger published_ssp_revision_id before insert or update on public.package_documents for each row execute function public.require_published_workflow_reference('ssp_revisions', 'ssp_revision_id');
create trigger published_assessment_plan_revision_id before insert or update on public.package_documents for each row execute function public.require_published_workflow_reference('assessment_plan_revisions', 'assessment_plan_revision_id');
create trigger published_assessment_results_revision_id before insert or update on public.package_documents for each row execute function public.require_published_workflow_reference('assessment_results_revisions', 'assessment_results_revision_id');
create trigger published_poam_revision_id before insert or update on public.package_documents for each row execute function public.require_published_workflow_reference('poam_revisions', 'poam_revision_id');
create trigger published_evidence_version_id before insert or update on public.package_documents for each row execute function public.require_published_workflow_reference('evidence_versions', 'evidence_version_id');
create trigger published_evidence_version_id before insert or update on public.observation_evidence for each row execute function public.require_published_workflow_reference('evidence_versions', 'evidence_version_id');
create trigger published_evidence_version_id before insert or update on public.requirement_evidence for each row execute function public.require_published_workflow_reference('evidence_versions', 'evidence_version_id');
create trigger published_evidence_version_id before insert or update on public.implementation_evidence for each row execute function public.require_published_workflow_reference('evidence_versions', 'evidence_version_id');
create trigger published_evidence_version_id before insert or update on public.finding_evidence for each row execute function public.require_published_workflow_reference('evidence_versions', 'evidence_version_id');
create trigger published_evidence_version_id before insert or update on public.test_run_evidence for each row execute function public.require_published_workflow_reference('evidence_versions', 'evidence_version_id');
create trigger published_evidence_version_id before insert or update on public.step_result_evidence for each row execute function public.require_published_workflow_reference('evidence_versions', 'evidence_version_id');
create trigger published_evidence_version_id before insert or update on public.task_evidence for each row execute function public.require_published_workflow_reference('evidence_versions', 'evidence_version_id');
create trigger published_evidence_version_id before insert or update on public.issue_evidence for each row execute function public.require_published_workflow_reference('evidence_versions', 'evidence_version_id');
create trigger published_evidence_version_id before insert or update on public.gate_evidence for each row execute function public.require_published_workflow_reference('evidence_versions', 'evidence_version_id');

select public.attach_parent_immutability('requirement_evidence', 'requirement_revisions', 'requirement_revision_id');
select public.attach_parent_immutability('requirement_verifications', 'requirement_revisions', 'requirement_revision_id');

-- Follow indirect revision parents for evidence uses that are part of documents.
create function public.guard_workflow_indirect_parent() returns trigger
language plpgsql set search_path = '' as $$
declare row_value jsonb; target_state text; target_id uuid; previous boolean;
begin
  foreach previous in array array[true, false] loop
    if (previous and tg_op = 'INSERT') or (not previous and tg_op = 'DELETE') then continue; end if;
    if previous then row_value := to_jsonb(old); else row_value := to_jsonb(new); end if;
    if tg_table_name = 'implementation_evidence' then
      target_id := (row_value->>'implementation_statement_id')::uuid;
      select r.state into target_state from public.implementation_statements s
        join public.ssp_revisions r on r.id = s.ssp_revision_id where s.id = target_id for share of r;
    elsif tg_table_name = 'finding_evidence' then
      target_id := (row_value->>'finding_id')::uuid;
      select r.state into target_state from public.assessment_findings f
        join public.assessment_results_revisions r on r.id = f.assessment_results_revision_id where f.id = target_id for share of r;
    end if;
    if target_state = 'published' then
      raise exception 'Published document content is immutable' using errcode = '23514';
    end if;
  end loop;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function public.guard_workflow_indirect_parent() from public, anon, authenticated;
create trigger published_document before insert or update or delete on public.implementation_evidence for each row execute function public.guard_workflow_indirect_parent();
create trigger published_document before insert or update or delete on public.finding_evidence for each row execute function public.guard_workflow_indirect_parent();

-- Serialize dependency edits per plan so concurrent additions cannot create cycles.
create function public.guard_assessment_dependency_cycle() returns trigger
language plpgsql set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.plan_revision_id::text, 0));
  if exists (
    with recursive ancestors(task_id) as (
      select new.depends_on_task_id
      union
      select d.depends_on_task_id from public.assessment_task_dependencies d
        join ancestors a on a.task_id = d.task_id
        where d.tenant_id = new.tenant_id and d.plan_revision_id = new.plan_revision_id and d.id <> new.id
    ) select 1 from ancestors where task_id = new.task_id
  ) then
    raise exception 'Assessment task dependencies cannot form a cycle' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_assessment_dependency_cycle() from public, anon, authenticated;
create trigger dependency_cycle before insert or update on public.assessment_task_dependencies for each row execute function public.guard_assessment_dependency_cycle();

-- A published results/risk/POA&M record freezes cited observations and their uses.
create function public.guard_published_observation() returns trigger
language plpgsql set search_path = '' as $$
declare target_observation_id uuid; row_value jsonb; previous boolean;
begin
  foreach previous in array array[true, false] loop
    if (previous and tg_op = 'INSERT') or (not previous and tg_op = 'DELETE') then continue; end if;
    if previous then row_value := to_jsonb(old); else row_value := to_jsonb(new); end if;
    target_observation_id := (row_value->>(case when tg_table_name = 'observations' then 'id' else 'observation_id' end))::uuid;
    perform pg_advisory_xact_lock(hashtextextended(target_observation_id::text, 1));
    if exists (select 1 from public.result_observations l join public.assessment_results_revisions r on r.id = l.assessment_results_revision_id where l.observation_id = target_observation_id and r.state = 'published')
      or exists (select 1 from public.finding_observations l join public.assessment_results_revisions r on r.id = l.assessment_results_revision_id where l.observation_id = target_observation_id and r.state = 'published')
      or exists (select 1 from public.risk_observations l join public.risk_revisions r on r.id = l.risk_revision_id where l.observation_id = target_observation_id and r.state = 'published')
      or exists (select 1 from public.poam_item_observations l join public.poam_item_revisions i on i.id = l.poam_item_revision_id where l.observation_id = target_observation_id and i.state = 'published') then
      raise exception 'An observation cited by a published revision is immutable' using errcode = '23514';
    end if;
  end loop;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function public.guard_published_observation() from public, anon, authenticated;
create trigger published_observation before update or delete on public.observations for each row execute function public.guard_published_observation();
create trigger published_observation before insert or update or delete on public.observation_evidence for each row execute function public.guard_published_observation();

-- Private binary evidence. Membership and a real draft version authorize upload.
insert into storage.buckets (id, name, public, file_size_limit)
values ('evidence', 'evidence', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;
alter table public.evidence_versions add column storage_object_id uuid references storage.objects(id) on delete restrict;
alter table public.evidence_versions add unique (storage_object_name);

create function public.can_access_evidence_object(object_name text, writing boolean default false) returns boolean
language plpgsql security definer set search_path = '' as $$
declare owner_tenant uuid; version_state text;
begin
  if writing then
    select tenant_id, state into owner_tenant, version_state
      from public.evidence_versions where storage_object_name = object_name for share;
  else
    select tenant_id, state into owner_tenant, version_state
      from public.evidence_versions where storage_object_name = object_name;
  end if;
  if owner_tenant is null then return false; end if;
  if writing then return version_state = 'draft' and public.can_write_tenant(owner_tenant); end if;
  return public.can_read_tenant(owner_tenant);
end;
$$;
revoke all on function public.can_access_evidence_object(text, boolean) from public, anon;
grant execute on function public.can_access_evidence_object(text, boolean) to authenticated;
create policy evidence_object_read on storage.objects for select to authenticated
  using (bucket_id = 'evidence' and public.can_access_evidence_object(name, false));
create policy evidence_object_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'evidence' and public.can_access_evidence_object(name, true));
create policy evidence_object_update on storage.objects for update to authenticated
  using (bucket_id = 'evidence' and public.can_access_evidence_object(name, true))
  with check (bucket_id = 'evidence' and public.can_access_evidence_object(name, true));
create policy evidence_object_delete on storage.objects for delete to authenticated
  using (bucket_id = 'evidence' and public.can_access_evidence_object(name, true));

create function public.guard_evidence_storage_reference() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.storage_object_id is not null and not exists (
    select 1 from storage.objects o where o.id = new.storage_object_id
      and o.bucket_id = 'evidence' and o.name = new.storage_object_name
  ) then
    raise exception 'Evidence object must match the tenant-owned version path' using errcode = '23514';
  end if;
  if new.state = 'published' and new.external_uri is null and new.storage_object_id is null then
    raise exception 'Published evidence requires an external location or an uploaded object' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_evidence_storage_reference() from public, anon, authenticated;
create trigger evidence_storage_reference before insert or update on public.evidence_versions for each row execute function public.guard_evidence_storage_reference();

-- Publication and observation edits take the same locks, so publication cannot
-- race a concurrent update to evidence that it cites.
create function public.freeze_workflow_observations() returns trigger
language plpgsql set search_path = '' as $$
declare target_id uuid;
begin
  if new.state <> 'published' then return new; end if;
  for target_id in
    select distinct observation_id from (
      select l.observation_id from public.result_observations l
        where tg_table_name = 'assessment_results_revisions' and l.assessment_results_revision_id = new.id
      union all select l.observation_id from public.finding_observations l
        where tg_table_name = 'assessment_results_revisions' and l.assessment_results_revision_id = new.id
      union all select l.observation_id from public.risk_observations l
        where tg_table_name = 'risk_revisions' and l.risk_revision_id = new.id
      union all select l.observation_id from public.poam_item_observations l
        where tg_table_name = 'poam_item_revisions' and l.poam_item_revision_id = new.id
    ) as linked order by observation_id
  loop
    perform pg_advisory_xact_lock(hashtextextended(target_id::text, 1));
    perform 1 from public.observations where id = target_id for share;
  end loop;
  return new;
end;
$$;
revoke all on function public.freeze_workflow_observations() from public, anon, authenticated;
create trigger freeze_observations before update on public.assessment_results_revisions for each row execute function public.freeze_workflow_observations();
create trigger freeze_observations before update on public.risk_revisions for each row execute function public.freeze_workflow_observations();
create trigger freeze_observations before update on public.poam_item_revisions for each row execute function public.freeze_workflow_observations();

-- Recorded decisions and activity entries are append-only; corrections are new rows.
create function public.prevent_workflow_record_rewrite() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'Recorded decisions and activity events are append-only' using errcode = '23514';
end;
$$;
revoke all on function public.prevent_workflow_record_rewrite() from public, anon, authenticated;
create trigger append_only before update or delete on public.authorization_decisions for each row execute function public.prevent_workflow_record_rewrite();
create trigger append_only before update or delete on public.review_decisions for each row execute function public.prevent_workflow_record_rewrite();
create trigger append_only before update or delete on public.activity_events for each row execute function public.prevent_workflow_record_rewrite();

-- A document revision can reuse an unchanged published item revision.
create table public.poam_revision_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  poam_document_id uuid not null,
  poam_revision_id uuid not null,
  poam_item_revision_id uuid not null,
  unique (tenant_id, id),
  unique (tenant_id, poam_revision_id, poam_item_revision_id),
  foreign key (tenant_id, poam_document_id, poam_revision_id) references public.poam_revisions(tenant_id, poam_document_id, id),
  foreign key (tenant_id, poam_document_id, poam_item_revision_id) references public.poam_item_revisions(tenant_id, poam_document_id, id)
);
select public.apply_tenant_security('poam_revision_items');
select public.attach_record_lifecycle('poam_revision_items');
select public.attach_parent_immutability('poam_revision_items', 'poam_revisions', 'poam_revision_id');
create trigger published_item_revision before insert or update on public.poam_revision_items for each row execute function public.require_published_workflow_reference('poam_item_revisions', 'poam_item_revision_id');
