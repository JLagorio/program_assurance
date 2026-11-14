-- A command's "no longer available" refusal answers 404, not 500.
--
-- A command refuses a record the reader chose that is gone, or that the session can no longer
-- read, in words the reader acts on ("Some of these records are no longer available; reload and
-- choose again"). It raised them as SQLSTATE P0002 (no_data_found), which PostgREST answers as
-- HTTP 500, a server error, so the browser logged a failure of the server for what is the reader's
-- to resolve. PostgREST answers a SQLSTATE `PTxyz` with HTTP status xyz, so each such refusal is
-- raised as PT404, Not Found, in the same words: assign_record_owner, the product commands and
-- reads (declare_product_element_change, plan_delta_assessment, record_product_determinations,
-- variant_version_changes, take_product_version), import_customer_requirements,
-- add_controls_to_assessment_plan, plan_control_assessment, publish_assessment_results and
-- command_assurance_navigation.
--
-- Each function keeps its body as the migrations before this one left it: only the errcode of its
-- raise changes, read from its definition and written back, as combined_baselines rewrites
-- set_program_baseline_overlays. Nothing catches P0002 from these functions, so no caller changes.
-- A function that still raised P0002 afterwards would stop this migration.
--
-- Every statement here can run again.

do $$
declare
  v_function regprocedure;
  v_old text;
  v_new text;
begin
  for v_function in
    select p.oid::regprocedure
      from pg_catalog.pg_proc p
      join pg_catalog.pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prokind = 'f'
       and pg_catalog.pg_get_functiondef(p.oid) ~ 'errcode\s*=\s*''P0002'''
     order by 1
  loop
    v_old := pg_catalog.pg_get_functiondef(v_function);
    v_new := regexp_replace(v_old, 'errcode\s*=\s*''P0002''', 'errcode = ''PT404''', 'g');
    execute v_new;
  end loop;
  if exists (
    select 1
      from pg_catalog.pg_proc p
      join pg_catalog.pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prokind = 'f'
       and pg_catalog.pg_get_functiondef(p.oid) ~ '''P0002'''
  ) then
    raise exception 'A function still refuses with SQLSTATE P0002, which PostgREST answers as HTTP 500';
  end if;
end $$;
