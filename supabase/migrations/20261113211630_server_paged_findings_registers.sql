-- The Findings & assets page's Observations and System assets tabs read one page at a time, as the
-- page's other registers do: the server pages, sorts, filters and searches, and counts the whole
-- result. Each reads a view that carries the columns it shows beyond its table's own (a program's
-- or a system's name, a test step's result), so a sort or a search on one runs on the server too.
-- The views run as the reader (security_invoker), so row-level security on every table they read
-- still decides what the reader sees. A status's rank column orders its values as the product's
-- vocabulary does (src/lib/status.ts).

-- One row per observation, for the Findings & assets page's Observations and a program's: its
-- program by name, and the determination recorded at the test step it was made at (result), with
-- the rank it sorts by.
create view public.observation_rows with (security_invoker = true) as
select o.id, o.tenant_id, o.title, o.description, o.method, o.observed_at, o.expires_at,
  o.program_id, o.assessment_event_id, o.step_result_id, o.subject_id, o.observer_party_id,
  o.revision, o.created_at, o.updated_at, o.created_by, o.updated_by,
  program.name as program_name,
  step.determination as result,
  pg_catalog.array_position('{met,not_met,blocked,not_applicable}'::text[], step.determination)
    as result_rank
from public.observations o
left join public.programs program on program.id = o.program_id
left join public.step_results step on step.id = o.step_result_id;
grant select on public.observation_rows to authenticated;
revoke all on public.observation_rows from public, anon;
comment on view public.observation_rows is 'The observations registers, one row per observation: its program by name, and its test step''s determination (result), with the rank it sorts by.';

-- One row per inventory item, for the Findings & assets page's System assets: every column of the
-- item, which the preview's Edit seeds its form from, and its system by code and name, with the
-- program the system belongs to, which the system's link names.
create view public.inventory_item_rows with (security_invoker = true) as
select i.id, i.tenant_id, i.system_id, i.composition_node_id, i.asset_id, i.name, i.description,
  i.serial_number, i.manufacturer, i.model, i.asset_owner_party_id, i.installed_on, i.retired_on,
  i.revision, i.created_at, i.updated_at, i.created_by, i.updated_by,
  public.natural_sort_key(i.asset_id) collate "C" as asset_order,
  system.code as system_code, system.name as system_name, system.program_id as system_program_id
from public.inventory_items i
left join public.systems system on system.id = i.system_id;
grant select on public.inventory_item_rows to authenticated;
revoke all on public.inventory_item_rows from public, anon;
comment on view public.inventory_item_rows is 'The System assets register, one row per inventory item: the item, and its system by code and name with the program it belongs to (system_program_id); asset_order orders asset ids as they read (A-2 before A-10).';
