-- Versions of an overlay. A published overlay is immutable, so changing what it decides means a new
-- version: a draft that starts from the published one's decisions and parameter values, edited,
-- then published itself. Each version is an overlay row of its own, chained to the one before it
-- (previous_overlay_id) and numbered (version), sharing its code. A version chain rather than
-- revisions under one overlay record, because everything that applies an overlay names the exact
-- overlay row it applied: profile_overlay_applications, the authored layer's profile and the
-- program's stack. Kept as rows, every one of those references keeps meaning "this version", a
-- program's stack keeps the version it applied until someone changes it, and a draft version is a
-- row that can be deleted without touching the published one.
--
--   * One next version a version, and only of a published one: the chain is a line.
--   * The code is the overlay's, the same in every version; a version may change its name and
--     description. (tenant_id, code) names the overlay, (tenant_id, code, version) one version.
--   * create_control_overlay_version makes the draft next version, carrying the decisions and the
--     values; its id is chosen once by the caller, so a request sent again answers the same draft.
--   * Taking a newer version into a program's stack is set_program_baseline_overlays with the newer
--     version in the older one's place: the stack keeps what lies beneath it and applies the newer
--     version, and whatever lies above, again.
-- See docs/control-baseline.md.

alter table public.control_overlays
  add column version integer not null default 1 check (version >= 1),
  add column previous_overlay_id uuid,
  add constraint control_overlays_previous_fkey foreign key (tenant_id,previous_overlay_id) references public.control_overlays(tenant_id,id),
  add constraint control_overlays_previous_not_self check (previous_overlay_id is distinct from id),
  add constraint control_overlays_first_version check ((version=1)=(previous_overlay_id is null));
alter table public.control_overlays drop constraint control_overlays_tenant_id_code_key;
alter table public.control_overlays add constraint control_overlays_tenant_code_version_key unique (tenant_id,code,version);
-- One next version a version: the chain is a line.
create unique index control_overlays_next_version_key on public.control_overlays(previous_overlay_id) where previous_overlay_id is not null;
comment on column public.control_overlays.version is 'The version''s number in its overlay''s chain: 1 for the first, one more than the version it was created from.';
comment on column public.control_overlays.previous_overlay_id is 'The version this one was created from; null for the first. A version has at most one next version.';

-- The register's derived columns, with each version's place in its chain and how many baselines
-- apply any version of the overlay.
create or replace view public.control_overlay_rows with (security_invoker=true) as
select o.id,o.tenant_id,o.catalog_revision_id,o.code,o.title,o.description,o.state,o.revision,o.created_at,o.updated_at,
  (select count(*)::integer from public.control_overlay_decisions d where d.overlay_id=o.id and d.action='include') as include_count,
  (select count(*)::integer from public.control_overlay_decisions d where d.overlay_id=o.id and d.action='exclude') as exclude_count,
  (select count(*)::integer from public.profile_overlay_applications a where a.overlay_id=o.id) as application_count,
  (select count(*)::integer from public.control_overlay_parameters p where p.overlay_id=o.id) as parameter_count,
  o.version,
  o.previous_overlay_id,
  (select n.id from public.control_overlays n where n.previous_overlay_id=o.id) as next_overlay_id,
  (select count(*)::integer from public.profile_overlay_applications a join public.control_overlays x on x.id=a.overlay_id
    where x.tenant_id=o.tenant_id and x.code=o.code) as overlay_application_count
from public.control_overlays o;
comment on view public.control_overlay_rows is 'Each overlay version with the controls it adds and removes and the parameters it sets counted, how many baselines apply it and any version of its overlay, and its place in its overlay''s chain (version, the one before it, the one after it).';

-- ---------------------------------------------------------------------------------------------
-- Saving a version keeps its overlay's code; a published version is changed through a new one.
-- ---------------------------------------------------------------------------------------------
create or replace function public.save_control_overlay(p_tenant_id uuid,p_id uuid,p_expected_revision bigint,p_overlay jsonb)
returns public.control_overlays language plpgsql security definer set search_path='' as $$
declare v_current public.control_overlays; v_answer public.control_overlays; v_code text; v_title text; v_description text; v_catalog uuid;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then raise exception 'Workspace write access is required' using errcode='42501'; end if;
  if p_id is null or jsonb_typeof(p_overlay) is distinct from 'object' then raise exception 'Enter the overlay details' using errcode='23514'; end if;
  v_code:=public.wizard_required_text(p_overlay,'code'); v_title:=public.wizard_required_text(p_overlay,'title');
  v_description:=nullif(btrim(p_overlay->>'description'),''); v_catalog:=nullif(p_overlay->>'catalogRevisionId','')::uuid;
  if length(v_code)>100 or length(v_title)>300 then raise exception 'The overlay code or name is too long' using errcode='23514'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
  select * into v_current from public.control_overlays where id=p_id for update;
  if found then
    if v_current.tenant_id<>p_tenant_id then raise exception 'Overlay was not found in this workspace' using errcode='23514'; end if;
    if v_current.code=v_code and v_current.title=v_title and v_current.description is not distinct from v_description and v_current.catalog_revision_id=v_catalog then return v_current; end if;
    if p_expected_revision is null then raise exception 'This overlay was already saved with different details. Reload it before saving.' using errcode='PT409'; end if;
    if v_current.state='published' then raise exception 'A published overlay cannot change. Create its next version instead.' using errcode='23514'; end if;
    if v_current.revision<>p_expected_revision then raise exception 'This overlay changed. Reload it before saving.' using errcode='PT409'; end if;
    if v_current.catalog_revision_id<>v_catalog then raise exception 'An overlay keeps the catalog edition it was created on' using errcode='23514'; end if;
    if v_current.code<>v_code then
      if v_current.previous_overlay_id is not null then raise exception 'A version keeps its overlay''s code, %',v_current.code using errcode='23514'; end if;
      if exists(select 1 from public.control_overlays where tenant_id=p_tenant_id and code=v_code and id<>p_id) then raise exception 'Another overlay already uses this code' using errcode='23505'; end if;
    end if;
    update public.control_overlays set code=v_code,title=v_title,description=v_description,revision=revision+1 where id=p_id returning * into v_answer;
  else
    if p_expected_revision is not null then raise exception 'This overlay was removed. Create it again.' using errcode='PT409'; end if;
    if not exists(select 1 from public.catalog_revisions where id=v_catalog and (tenant_id is null or tenant_id=p_tenant_id) and state='published') then raise exception 'Choose a published catalog edition' using errcode='23514'; end if;
    if exists(select 1 from public.control_overlays where tenant_id=p_tenant_id and code=v_code) then raise exception 'Another overlay already uses this code' using errcode='23505'; end if;
    insert into public.control_overlays(id,tenant_id,catalog_revision_id,code,title,description) values(p_id,p_tenant_id,v_catalog,v_code,v_title,v_description) returning * into v_answer;
  end if;
  return v_answer;
end; $$;
comment on function public.save_control_overlay(uuid,uuid,bigint,jsonb) is 'Create a draft overlay, its first version (expected revision NULL), or edit a draft version''s code, name and description at the revision the reader saw; a version after the first keeps its overlay''s code. A repeat of a save that landed returns the saved overlay.';

-- The decisions' refusal names the way on, as the values' does.
do $$
declare v_old text; v_new text;
begin
  v_old:=pg_get_functiondef('public.set_control_overlay_decisions(uuid,uuid,bigint,jsonb,jsonb)'::regprocedure);
  v_new:=replace(v_old,'A published overlay cannot change. Create a new overlay instead.','A published overlay cannot change. Create its next version instead.');
  if v_new=v_old then raise exception 'set_control_overlay_decisions no longer says how a published overlay changes'; end if;
  execute v_new;
end $$;

-- ---------------------------------------------------------------------------------------------
-- The next version of a published overlay: a draft with its decisions and its values.
-- ---------------------------------------------------------------------------------------------
create function public.create_control_overlay_version(p_tenant_id uuid,p_overlay_id uuid,p_version_id uuid)
returns public.control_overlays language plpgsql security definer set search_path='' as $$
declare v_source public.control_overlays; v_existing public.control_overlays; v_next public.control_overlays;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then raise exception 'Workspace write access is required' using errcode='42501'; end if;
  if p_overlay_id is null or p_version_id is null then raise exception 'Choose the overlay whose next version to create' using errcode='23514'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_tenant_id::text||'/overlay-version/'||p_version_id::text,0));
  -- Sent again: the version this id names already is the next version of this overlay.
  select * into v_existing from public.control_overlays where id=p_version_id;
  if found then
    if v_existing.tenant_id<>p_tenant_id or v_existing.previous_overlay_id is distinct from p_overlay_id then
      raise exception 'This request was already used for another overlay. Reload the overlay before creating its next version.' using errcode='PT409';
    end if;
    return v_existing;
  end if;
  select * into v_source from public.control_overlays where tenant_id=p_tenant_id and id=p_overlay_id for update;
  if v_source.id is null then raise exception 'Overlay was not found in this workspace' using errcode='23514'; end if;
  if v_source.state<>'published' then raise exception 'Publish % before creating its next version',v_source.title using errcode='23514'; end if;
  select * into v_next from public.control_overlays where previous_overlay_id=p_overlay_id;
  if v_next.id is not null then
    raise exception 'Version % of % already exists. Open it to edit it.',v_next.version,v_source.title using errcode='23514';
  end if;
  insert into public.control_overlays(id,tenant_id,catalog_revision_id,code,title,description,version,previous_overlay_id)
    values(p_version_id,p_tenant_id,v_source.catalog_revision_id,v_source.code,v_source.title,v_source.description,v_source.version+1,v_source.id)
    returning * into v_next;
  insert into public.control_overlay_decisions(tenant_id,overlay_id,control_id,action,rationale)
    select p_tenant_id,p_version_id,d.control_id,d.action,d.rationale from public.control_overlay_decisions d where d.overlay_id=p_overlay_id;
  insert into public.control_overlay_parameters(tenant_id,overlay_id,parameter_id,parameter_values,rationale)
    select p_tenant_id,p_version_id,p.parameter_id,p.parameter_values,p.rationale from public.control_overlay_parameters p where p.overlay_id=p_overlay_id;
  return v_next;
end; $$;
revoke all on function public.create_control_overlay_version(uuid,uuid,uuid) from public,anon;
grant execute on function public.create_control_overlay_version(uuid,uuid,uuid) to authenticated;
comment on function public.create_control_overlay_version(uuid,uuid,uuid) is 'Create the next version of a published overlay as a draft (id p_version_id, chosen once by the caller): the same code and catalog edition, its name, description, decisions and parameter values, numbered one more. A version has at most one next version, so the overlay''s newest version is the only one a next version is made from. The same id sent again answers the same draft.';

-- Deleting a draft version leaves the version it was created from as it is; delete_control_overlay
-- deletes only the row it names, and the version before it may take a next version again.
comment on function public.delete_control_overlay(uuid,uuid,bigint) is 'Delete a draft overlay version, its decisions and its parameter values at the revision the reader saw; the version it was created from stays as it is. A published version, or one a program''s stack applies, is refused. An overlay already gone answers false, so a request sent again changes nothing.';
